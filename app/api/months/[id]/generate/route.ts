import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { contentGenerator } from '@/lib/agents/content-generator'

// Vercel Pro: Allow up to 5 minutes (300s) for generation
export const maxDuration = 300;
export const dynamic = 'force-dynamic';

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const monthId = params.id
        console.log(`[Generate] Starting full month generation for ${monthId}...`)

        // 1. Fetch Data
        const contentMonth = await prisma.contentMonth.findUnique({
            where: { id: monthId },
            include: {
                client: {
                    include: { brandKit: true, knowledgeBase: true, plan: true }
                }
            }
        })

        if (!contentMonth || !contentMonth.client) {
            return NextResponse.json({ error: 'Mes o Cliente no encontrado' }, { status: 404 })
        }

        const client = contentMonth.client

        // 2. Prepare Context for AI
        const brandContext = {
            name: client.name,
            industry: client.industry || 'General',
            about: client.knowledgeBase?.about || client.description || '',
            primaryTone: client.brandKit?.primaryTone || client.brandKit?.tone || 'Profesional',
            brandPersonality: client.brandKit?.brandPersonality || [],
            products: (client.knowledgeBase?.products as any) || [],
            targetAudiences: (client.knowledgeBase?.targetAudiences as any) || [],
            speakingAs: (client.brandKit?.speakingAs as any) || 'nosotros',
            emojiUsage: (client.brandKit?.emojiUsage as any) || 'moderado',
            guardrails: client.brandKit?.guardrails || [],
            forbiddenWords: client.brandKit?.forbiddenWords || [],
            requiredHashtags: client.brandKit?.requiredHashtags || [],
            forbiddenHashtags: client.brandKit?.forbiddenHashtags || []
        }

        const monthBrief = {
            month: contentMonth.month,
            year: contentMonth.year,
            primaryObjective: contentMonth.primaryObjective || 'Aumentar interacción',
            specificGoal: contentMonth.specificGoal || '',
            seasonality: contentMonth.seasonality || '',
            relevantDates: (contentMonth.relevantDates as any) || [],
            contentPillars: (contentMonth.contentPillars as any) || []
        }

        // Plan: Use specific client plan or defaults
        const plan = {
            posts: client.plan?.postsPerMonth || 12,
            carousels: client.plan?.carouselsPerMonth || 4,
            reels: client.plan?.reelsPerMonth || 4,
            stories: client.plan?.storiesPerMonth || 10
        }

        // 3. Mark as Generating
        await prisma.contentMonth.update({
            where: { id: monthId },
            data: { status: 'GENERATING' }
        })

        // 4. Call Monolithic Generator (Takes 30-60s)
        const result = await contentGenerator.generateMonth(
            brandContext,
            monthBrief,
            plan,
            client.workspaceId
        )

        // 5. Database Transaction: Save Strategy + Pieces
        await prisma.$transaction(async (tx) => {
            // Update Strategy
            await tx.contentMonth.update({
                where: { id: monthId },
                data: {
                    strategy: result.strategy as object,
                    status: 'GENERATED',
                    generatedAt: new Date()
                }
            })

            // Wipe old pieces
            await tx.contentPiece.deleteMany({ where: { contentMonthId: monthId } })

            // Create new pieces
            for (let i = 0; i < result.pieces.length; i++) {
                const p = result.pieces[i]
                await tx.contentPiece.create({
                    data: {
                        contentMonthId: monthId,
                        type: p.format,
                        title: p.topic,
                        pillar: p.pillar,
                        copy: {
                            hooks: p.hooks,
                            captionLong: p.captionLong,
                            captionShort: p.captionShort,
                            ctas: p.ctas
                        },
                        hashtags: p.hashtags,
                        visualBrief: p.visualBrief,
                        suggestedDate: new Date(contentMonth.year, contentMonth.month - 1, p.dayOfMonth),
                        status: 'DRAFT',
                        order: i + 1,
                        metadata: {
                            carouselSlides: p.carouselSlides || null
                        }
                    }
                })
            }
        })

        return NextResponse.json({ success: true, count: result.pieces.length })

    } catch (error: any) {
        console.error('[Generate Error]', error)
        // Revert status if possible
        await prisma.contentMonth.update({
            where: { id: params.id },
            data: { status: 'DRAFT' } // Reset to draft on failure
        }).catch(() => { })

        return NextResponse.json(
            { error: error.message || 'Error generando contenido' },
            { status: 500 }
        )
    }
}
