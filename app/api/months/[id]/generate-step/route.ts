import { NextRequest, NextResponse } from 'next/server'
export const maxDuration = 60; // Increased for Pro / Faster processing
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateStrategy, generateSinglePiece } from '@/lib/agents/piece-generator'
import type { BrandContext, MonthBrief } from '@/lib/agents/content-generator'

/**
 * POST /api/months/[id]/generate-step
 * 
 * Browser-driven step-by-step generation.
 * Each call generates ONE thing (strategy or a single piece) in < 10s.
 * The browser calls this repeatedly until all pieces are done.
 * 
 * Steps:
 *   { step: "strategy" } → generates strategy, returns piece assignments
 *   { step: "piece", assignment: {...}, pieceNumber: N, totalPieces: T } → generates 1 piece
 *   { step: "finalize" } → marks month as GENERATED
 */
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const body = await request.json()
        const { step } = body

        // ─── STRATEGY STEP ───
        if (step === 'strategy') {
            const month = await prisma.contentMonth.findUnique({
                where: { id: params.id },
                include: {
                    client: {
                        include: { brandKit: true, knowledgeBase: true, plan: true }
                    }
                }
            })

            if (!month) return NextResponse.json({ error: 'Mes no encontrado' }, { status: 404 })

            const { client } = month
            const brandContext = buildBrandContext(client)
            const monthBrief = buildMonthBrief(month)
            const plan = {
                posts: client.plan?.postsPerMonth || 12,
                carousels: client.plan?.carouselsPerMonth || 4,
                reels: client.plan?.reelsPerMonth || 4,
                stories: client.plan?.storiesPerMonth || 10,
            }

            // Mark as generating
            await prisma.contentMonth.update({
                where: { id: params.id },
                data: { status: 'GENERATING' }
            })

            // Generate strategy with Claude (~5s)
            const strategy = await generateStrategy(brandContext, monthBrief, plan, client.workspaceId)

            // Save strategy
            await prisma.contentMonth.update({
                where: { id: params.id },
                data: { strategy: strategy as object }
            })

            return NextResponse.json({
                success: true,
                strategy,
                assignments: strategy.pieceAssignments || [],
                totalPieces: (strategy.pieceAssignments || []).length,
            })
        }

        // ─── PIECE STEP ───
        if (step === 'piece') {
            const { assignment, pieceNumber, totalPieces } = body

            const month = await prisma.contentMonth.findUnique({
                where: { id: params.id },
                include: {
                    client: {
                        include: { brandKit: true, knowledgeBase: true, plan: true }
                    }
                }
            })

            if (!month) return NextResponse.json({ error: 'Mes no encontrado' }, { status: 404 })

            const brandContext = buildBrandContext(month.client)
            const monthBrief = buildMonthBrief(month)

            // Generate ONE piece with Claude (~5s)
            const piece = await generateSinglePiece({
                brand: brandContext,
                brief: monthBrief,
                format: assignment.format,
                pillar: assignment.pillar,
                dayOfMonth: assignment.dayOfMonth,
                pieceNumber,
                totalPieces,
            }, month.client.workspaceId)

            // Save piece to DB immediately
            await prisma.contentPiece.create({
                data: {
                    contentMonthId: params.id,
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
                    order: pieceNumber - 1,
                    metadata: {
                        carouselSlides: piece.carouselSlides || null,
                    } as object,
                }
            })

            const progress = Math.round((pieceNumber / totalPieces) * 100)

            return NextResponse.json({
                success: true,
                piece: { title: piece.topic, format: piece.format, pillar: piece.pillar },
                progress,
                completed: pieceNumber >= totalPieces,
            })
        }

        // ─── FINALIZE STEP ───
        if (step === 'finalize') {
            await prisma.contentMonth.update({
                where: { id: params.id },
                data: {
                    status: 'GENERATED',
                    generatedAt: new Date(),
                }
            })

            return NextResponse.json({ success: true, status: 'GENERATED' })
        }

        return NextResponse.json({ error: 'Step inválido' }, { status: 400 })

    } catch (error: any) {
        console.error('Error in generate-step:', error)
        return NextResponse.json(
            { error: error.message || 'Error en generación' },
            { status: 500 }
        )
    }
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
