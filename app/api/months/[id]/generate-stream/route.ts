import { NextRequest, NextResponse } from 'next/server'
export const maxDuration = 300; // Vercel Pro: 5 minutes timeout
export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateStrategy, generateSinglePiece } from '@/lib/agents/piece-generator'

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const monthId = params.id

    // Use ReadableStream for Server-Sent Events
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
        async start(controller) {
            const send = (event: any) => {
                try {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
                } catch (e) {
                    console.error('Error sending SSE:', e)
                }
            }

            try {
                console.log(`[Stream] Starting generation for month ${monthId}`)
                send({ type: 'status', message: '🚀 Iniciando conexión segura...', progress: 1 })

                // 1. Load Data
                const month = await prisma.contentMonth.findUnique({
                    where: { id: monthId },
                    // FIX: products and targetAudiences are inside KnowledgeBase
                    include: { client: { include: { brandKit: true, knowledgeBase: true } } }
                })

                if (!month || !month.client) {
                    throw new Error('Mes o Cliente no encontrado')
                }

                // 2. Reset pieces (optional context-dependent, but safer here)
                await prisma.contentPiece.deleteMany({ where: { contentMonthId: monthId } })

                // 3. Generate Strategy
                send({ type: 'status', message: '🧠 Analizando marca y estrategia...', progress: 5 })

                const plan = { posts: 4, carousels: 2, reels: 3, stories: 3 } // Default plan

                const brandContext: any = {
                    name: month.client.name,
                    industry: month.client.industry,
                    // FIX: Map fields from brandKit model correctly
                    about: month.client.brandKit?.missionStatement || month.client.description || '',
                    primaryTone: month.client.brandKit?.primaryTone || month.client.brandKit?.tone || 'Profesional',
                    brandPersonality: month.client.brandKit?.brandPersonality || [],
                    products: month.client.knowledgeBase?.products || [],
                    targetAudiences: month.client.knowledgeBase?.targetAudiences || [],
                }

                const monthBrief: any = {
                    month: month.month,
                    year: month.year,
                    primaryObjective: month.primaryObjective || 'Engagement', // FIX: Use correct field name from schema
                    additionalContext: month.specificGoal || '' // FIX: specificGoal instead of context
                }

                console.log('[Stream] Calling generateStrategy...')
                const strategy = await generateStrategy(brandContext, monthBrief, plan, month.client.workspaceId)

                // Save strategy
                await prisma.contentMonth.update({
                    where: { id: monthId },
                    data: { strategy: strategy as any, status: 'GENERATING' }
                })

                const assignments = strategy.pieceAssignments || []
                const total = assignments.length

                send({
                    type: 'strategy',
                    message: 'Estrategia lista',
                    totalPieces: total,
                    progress: 10
                })

                console.log(`[Stream] Strategy done. Generating ${total} pieces...`)

                // 4. Generate Pieces Loop
                for (let i = 0; i < assignments.length; i++) {
                    const assignment = assignments[i]
                    const currentProgress = 10 + Math.round(((i + 1) / total) * 90)

                    send({
                        type: 'status',
                        message: `Creando pieza ${i + 1}/${total}: ${assignment.format}...`,
                        progress: currentProgress,
                        pieceNumber: i + 1,
                        totalPieces: total
                    })

                    try {
                        const pieceData = await generateSinglePiece({
                            brand: brandContext,
                            brief: monthBrief,
                            format: assignment.format as any,
                            pillar: assignment.pillar,
                            dayOfMonth: assignment.dayOfMonth,
                            pieceNumber: i + 1,
                            totalPieces: total
                        }, month.client.workspaceId)

                        // Save piece
                        await prisma.contentPiece.create({
                            data: {
                                contentMonthId: monthId,
                                title: pieceData.topic,
                                type: pieceData.format as any, // FIX: type vs format
                                pillar: pieceData.pillar,
                                status: 'DRAFT',
                                suggestedDate: new Date(month.year, month.month - 1, pieceData.dayOfMonth).toISOString(),
                                copy: { // FIX: content -> copy in Prisma Schema
                                    hooks: pieceData.hooks,
                                    captionLong: pieceData.captionLong,
                                    captionShort: pieceData.captionShort,
                                    ctas: pieceData.ctas
                                },
                                hashtags: pieceData.hashtags || [], // FIX: hashtags array separate
                                visualBrief: pieceData.visualBrief,
                                metadata: {
                                    carouselSlides: pieceData.carouselSlides
                                }
                            }
                        })

                        send({
                            type: 'piece',
                            data: { title: pieceData.topic },
                            pieceNumber: i + 1,
                            totalPieces: total,
                            progress: currentProgress
                        })

                    } catch (pieceError: any) {
                        console.error(`Error generating piece ${i + 1}:`, pieceError)
                        send({
                            type: 'piece_error',
                            message: `Error en pieza ${i + 1}: ${pieceError.message}`,
                            progress: currentProgress
                        })
                        // Continue to next piece! don't abort
                    }
                }

                // 5. Finalize
                await prisma.contentMonth.update({
                    where: { id: monthId },
                    data: { status: 'DRAFT' } // Ready for review
                })

                send({ type: 'complete', message: '¡Generación completada!', progress: 100 })
                console.log('[Stream] Finished successfully')

            } catch (error: any) {
                console.error('[Stream] CRITICAL ERROR:', error)
                // Send specific error to client
                send({ type: 'error', message: error.message || 'Error crítico en el servidor' })

                // Reset status so it's not stuck
                try {
                    await prisma.contentMonth.update({ where: { id: monthId }, data: { status: 'DRAFT' } })
                } catch (e) { }

            } finally {
                try {
                    controller.close()
                } catch (e) { }
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
