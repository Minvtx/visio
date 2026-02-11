import { NextRequest } from 'next/server'
export const maxDuration = 300; // Vercel Pro: 5 minutes

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateStrategy, generateSinglePiece } from '@/lib/agents/piece-generator'
import type { BrandContext, MonthBrief } from '@/lib/agents/content-generator'

/**
 * POST /api/months/[id]/generate-stream
 * 
 * Vercel Pro streaming generation.
 * Generates the ENTIRE month (strategy + all pieces) in a single request.
 * Sends progress updates via Server-Sent Events (SSE).
 * 
 * SSE Events:
 *   { type: "status", message: string, progress: number }
 *   { type: "strategy", data: object }
 *   { type: "piece", data: object, pieceNumber: number, totalPieces: number }
 *   { type: "complete", totalPieces: number, failedPieces: number }
 *   { type: "error", message: string }
 */
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
        return new Response(JSON.stringify({ error: 'No autorizado' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        })
    }

    const monthId = params.id

    // Create a readable stream for SSE
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
        async start(controller) {
            const send = (event: any) => {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
            }

            try {
                // ─── LOAD DATA ───
                send({ type: 'status', message: 'Cargando datos del cliente...', progress: 0 })

                const month = await prisma.contentMonth.findUnique({
                    where: { id: monthId },
                    include: {
                        client: {
                            include: { brandKit: true, knowledgeBase: true, plan: true }
                        }
                    }
                })

                if (!month) {
                    send({ type: 'error', message: 'Mes no encontrado' })
                    controller.close()
                    return
                }

                const { client } = month
                const brandContext = buildBrandContext(client)
                const monthBrief = buildMonthBrief(month)
                const plan = {
                    posts: client.plan?.postsPerMonth || 12,
                    carousels: client.plan?.carouselsPerMonth || 4,
                    reels: client.plan?.reelsPerMonth || 4,
                    stories: client.plan?.storiesPerMonth || 10,
                }

                // ─── RESET ───
                send({ type: 'status', message: '🧹 Limpiando contenido anterior...', progress: 1 })

                await prisma.contentPiece.deleteMany({
                    where: { contentMonthId: monthId }
                })

                await prisma.contentMonth.update({
                    where: { id: monthId },
                    data: { status: 'GENERATING', generatedAt: null }
                })

                // ─── STRATEGY ───
                send({ type: 'status', message: '🎯 Generando estrategia mensual con IA...', progress: 3 })

                const strategy = await generateStrategy(brandContext, monthBrief, plan, client.workspaceId)

                await prisma.contentMonth.update({
                    where: { id: monthId },
                    data: { strategy: strategy as object }
                })

                const assignments = strategy.pieceAssignments || []
                const total = assignments.length

                if (total === 0) {
                    send({ type: 'error', message: 'La IA no generó asignaciones de piezas.' })
                    await prisma.contentMonth.update({
                        where: { id: monthId },
                        data: { status: 'DRAFT' }
                    })
                    controller.close()
                    return
                }

                send({
                    type: 'strategy',
                    data: strategy,
                    totalPieces: total,
                    progress: 5
                })

                // ─── GENERATE PIECES ───
                let successCount = 0
                let failCount = 0

                for (let i = 0; i < assignments.length; i++) {
                    const assignment = assignments[i]
                    const progress = 5 + Math.round(((i + 1) / total) * 90) // 5-95%

                    send({
                        type: 'status',
                        message: `✍️ Pieza ${i + 1}/${total}: ${assignment.format} - ${assignment.pillar}`,
                        progress,
                        pieceNumber: i + 1,
                        totalPieces: total
                    })

                    try {
                        const piece = await generateSinglePiece({
                            brand: brandContext,
                            brief: monthBrief,
                            format: assignment.format,
                            pillar: assignment.pillar,
                            dayOfMonth: assignment.dayOfMonth,
                            pieceNumber: i + 1,
                            totalPieces: total,
                        }, client.workspaceId)

                        // Save piece immediately
                        await prisma.contentPiece.create({
                            data: {
                                contentMonthId: monthId,
                                type: piece.format,
                                title: piece.topic,
                                pillar: piece.pillar,
                                copy: JSON.stringify({
                                    hooks: piece.hooks,
                                    captionLong: piece.captionLong,
                                    captionShort: piece.captionShort,
                                    ctas: piece.ctas,
                                }),
                                hashtags: piece.hashtags,
                                visualBrief: piece.visualBrief,
                                suggestedDate: new Date(month.year, month.month - 1, piece.dayOfMonth),
                                status: 'DRAFT',
                                order: i,
                                metadata: {
                                    carouselSlides: piece.carouselSlides || null,
                                } as object,
                            }
                        })

                        successCount++

                        send({
                            type: 'piece',
                            data: { title: piece.topic, format: piece.format, pillar: piece.pillar },
                            pieceNumber: i + 1,
                            totalPieces: total,
                            progress
                        })

                    } catch (pieceErr: any) {
                        console.error(`Pieza ${i + 1} falló:`, pieceErr.message)
                        failCount++

                        send({
                            type: 'piece_error',
                            message: `Pieza ${i + 1} falló: ${pieceErr.message}`,
                            pieceNumber: i + 1,
                            totalPieces: total,
                            progress
                        })
                    }
                }

                // ─── FINALIZE ───
                send({ type: 'status', message: '✅ Finalizando...', progress: 98 })

                await prisma.contentMonth.update({
                    where: { id: monthId },
                    data: {
                        status: 'GENERATED',
                        generatedAt: new Date(),
                    }
                })

                send({
                    type: 'complete',
                    totalPieces: total,
                    successCount,
                    failedPieces: failCount,
                    progress: 100,
                    message: failCount > 0
                        ? `⚠️ Listo con ${failCount} errores. ${successCount} piezas generadas.`
                        : `🎉 ¡${successCount} piezas generadas exitosamente!`
                })

            } catch (error: any) {
                console.error('Error in generate-stream:', error)

                send({ type: 'error', message: error.message || 'Error en la generación' })

                // Reset month status so it doesn't stay stuck
                try {
                    await prisma.contentMonth.update({
                        where: { id: monthId },
                        data: { status: 'DRAFT' }
                    })
                } catch (e) {
                    console.error('Failed to reset month after error:', e)
                }
            } finally {
                controller.close()
            }
        }
    })

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        },
    })
}

// ─── HELPERS ───

function buildBrandContext(client: any): BrandContext {
    return {
        name: client.name,
        industry: client.industry || 'General',
        brandPersonality: client.brandKit?.brandPersonality || [],
        brandArchetype: client.brandKit?.brandArchetype || undefined,
        tagline: client.brandKit?.tagline || undefined,
        valueProposition: client.brandKit?.valueProposition || undefined,
        primaryTone: client.brandKit?.primaryTone || client.brandKit?.tone || 'Profesional pero cercano',
        secondaryTone: client.brandKit?.secondaryTone || undefined,
        speakingAs: (client.brandKit?.speakingAs as any) || 'nosotros',
        emojiUsage: (client.brandKit?.emojiUsage as any) || 'moderado',
        about: client.knowledgeBase?.about || client.description || '',
        products: (client.knowledgeBase?.products as any) || [],
        targetAudiences: (client.knowledgeBase?.targetAudiences as any) || [],
        guardrails: client.brandKit?.guardrails || [],
        forbiddenWords: client.brandKit?.forbiddenWords || [],
        requiredHashtags: client.brandKit?.requiredHashtags || [],
        forbiddenHashtags: client.brandKit?.forbiddenHashtags || [],
    }
}

function buildMonthBrief(month: any): MonthBrief {
    return {
        month: month.month,
        year: month.year,
        primaryObjective: month.primaryObjective || undefined,
        specificGoal: month.specificGoal || undefined,
        seasonality: month.seasonality || undefined,
        relevantDates: (month.relevantDates as any) || [],
        contentPillars: (month.contentPillars as any) || [],
    }
}
