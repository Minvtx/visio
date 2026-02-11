import { NextRequest, NextResponse } from 'next/server'
export const maxDuration = 300; // Vercel Pro: 5 minutes timeout
export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateStrategy, generateSinglePiece } from '@/lib/agents/piece-generator'

// Helper to build context
function buildBrandContext(client: any) {
    return {
        name: client.name,
        industry: client.industry,
        about: client.brandKit?.missionStatement || client.description || '',
        primaryTone: client.brandKit?.primaryTone || client.brandKit?.tone || 'Profesional',
        brandPersonality: client.brandKit?.brandPersonality || [],
        products: client.knowledgeBase?.products || [],
        targetAudiences: client.knowledgeBase?.targetAudiences || [],
        requiredHashtags: client.brandKit?.requiredHashtags || [],
        forbiddenWords: client.brandKit?.forbiddenWords || [],
        guardrails: client.brandKit?.guardrails || []
    }
}

function buildMonthBrief(month: any) {
    return {
        month: month.month,
        year: month.year,
        primaryObjective: month.primaryObjective || 'Engagement',
        additionalContext: month.specificGoal || '',
        activeCampaigns: month.activeCampaigns || []
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)
        // Check for session/user presence robustly
        if (!session?.user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const body = await request.json()
        const { step } = body

        // ─── STRATEGY STEP ───
        if (step === 'strategy') {
            console.log('[Step] Strategy generation started')
            const month = await prisma.contentMonth.findUnique({
                where: { id: params.id },
                include: {
                    client: {
                        include: { brandKit: true, knowledgeBase: true, plan: true }
                    }
                }
            })

            if (!month || !month.client) return NextResponse.json({ error: 'Mes no encontrado' }, { status: 404 })

            const { client } = month
            const brandContext = buildBrandContext(client)
            const monthBrief = buildMonthBrief(month)

            // Plan defaults
            const plan = {
                posts: 4,
                carousels: 2,
                reels: 3,
                stories: 3,
            }

            // Mark as generating
            await prisma.contentMonth.update({
                where: { id: params.id },
                data: { status: 'GENERATING' }
            })

            // Generate strategy with Claude (~5s)
            // Note: generateStrategy now has internal try/catch fallback, so it shouldn't fail fatally
            const strategy = await generateStrategy(brandContext, monthBrief, plan, client.workspaceId)

            // Normalize: Claude might use different key names for assignments
            let assignments = strategy.pieceAssignments
                || strategy.piece_assignments
                || strategy.assignments
                || strategy.pieces
                || strategy.content
                || []

            // If Claude returned 0 assignments, generate defaults from plan
            const totalPieces = plan.posts + plan.carousels + plan.reels + plan.stories
            if (!Array.isArray(assignments) || assignments.length === 0) {
                console.warn('[Step] Strategy had 0 assignments! Generating defaults...')
                assignments = []
                const formats = [
                    ...Array(plan.posts).fill('POST'),
                    ...Array(plan.carousels).fill('CAROUSEL'),
                    ...Array(plan.reels).fill('REEL'),
                    ...Array(plan.stories).fill('STORY'),
                ]
                const pillars = (strategy.pillars || [
                    { name: 'Educación' }, { name: 'Entretenimiento' }, { name: 'Venta' }
                ])
                for (let i = 0; i < formats.length; i++) {
                    assignments.push({
                        dayOfMonth: Math.min(28, (i * 2) + 1),
                        format: formats[i],
                        pillar: pillars[i % pillars.length]?.name || 'General'
                    })
                }
            }

            // Save strategy with normalized assignments
            strategy.pieceAssignments = assignments
            await prisma.contentMonth.update({
                where: { id: params.id },
                data: { strategy: strategy as object }
            })

            console.log(`[Step] Strategy done. ${assignments.length} assignments ready.`)

            return NextResponse.json({
                success: true,
                strategy,
                assignments,
                totalPieces: assignments.length
            })
        }

        // ─── PIECE STEP ───
        else if (step === 'piece') {
            const { assignment, pieceNumber, totalPieces } = body
            console.log(`[Step] Generating piece ${pieceNumber}/${totalPieces}`)

            const month = await prisma.contentMonth.findUnique({
                where: { id: params.id },
                include: {
                    client: {
                        include: { brandKit: true, knowledgeBase: true }
                    }
                }
            })

            if (!month || !month.client) return NextResponse.json({ error: 'Mes no encontrado' }, { status: 404 })

            const brandContext = buildBrandContext(month.client)
            const monthBrief = buildMonthBrief(month)

            // Generate ONE piece with Claude (~5-10s)
            const piece = await generateSinglePiece({
                brand: brandContext,
                brief: monthBrief,
                format: assignment.format,
                pillar: assignment.pillar,
                dayOfMonth: assignment.dayOfMonth,
                pieceNumber,
                totalPieces,
            }, month.client.workspaceId)

            // Get status
            const suggestedDate = new Date(month.year, month.month - 1, piece.dayOfMonth)

            // Save piece to DB immediately
            await prisma.contentPiece.create({
                data: {
                    contentMonthId: params.id,
                    type: piece.format as any, // Cast to enum
                    title: piece.topic,
                    pillar: piece.pillar,
                    // Use 'copy' JSON field
                    copy: {
                        hooks: piece.hooks,
                        captionLong: piece.captionLong,
                        captionShort: piece.captionShort,
                        ctas: piece.ctas,
                    },
                    hashtags: piece.hashtags || [],
                    visualBrief: piece.visualBrief,
                    suggestedDate: suggestedDate.toISOString(),
                    status: 'DRAFT',
                    order: pieceNumber,
                    metadata: {
                        carouselSlides: piece.carouselSlides || null,
                    }
                }
            })

            return NextResponse.json({
                success: true,
                piece: { title: piece.topic, format: piece.format },
                progress: Math.round((pieceNumber / totalPieces) * 100)
            })
        }

        // ─── FINALIZE STEP ───
        else if (step === 'finalize') {
            await prisma.contentMonth.update({
                where: { id: params.id },
                data: {
                    status: 'GENERATED', // Or DRAFT depending on workflow
                    generatedAt: new Date(),
                }
            })
            return NextResponse.json({ success: true })
        }

        return NextResponse.json({ error: 'Invalid step' }, { status: 400 })

    } catch (error: any) {
        console.error('[Generate Step Error]', error)
        return NextResponse.json({
            error: error.message || 'Error interno del servidor',
            details: error.toString()
        }, { status: 500 })
    }
}
