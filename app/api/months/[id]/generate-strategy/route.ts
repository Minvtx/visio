import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getWorkspaceApiKeys } from '@/lib/workspace'
import { generateStrategy } from '@/lib/agents/piece-generator'
import type { BrandContext, MonthBrief } from '@/lib/agents/content-generator'

export const maxDuration = 60 // Allow up to 60s for strategy generation (Vercel Hobby limit is 10s for serverless, but 60s for Edge/longer if configured, though we target <10s)

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        // 1. Fetch Month & Client Data
        const contentMonth = await prisma.contentMonth.findUnique({
            where: { id: params.id },
            include: {
                client: {
                    include: { brandKit: true, knowledgeBase: true, plan: true },
                },
            },
        })

        if (!contentMonth) {
            return NextResponse.json({ error: 'Mes no encontrado' }, { status: 404 })
        }

        const client = contentMonth.client

        // 2. Build Context
        const brandContext: BrandContext = {
            name: client.name,
            industry: client.industry || "General",
            brandPersonality: client.brandKit?.brandPersonality || [],
            brandArchetype: client.brandKit?.brandArchetype || undefined,
            tagline: client.brandKit?.tagline || undefined,
            valueProposition: client.brandKit?.valueProposition || undefined,
            primaryTone: client.brandKit?.primaryTone || client.brandKit?.tone || "Profesional pero cercano",
            secondaryTone: client.brandKit?.secondaryTone || undefined,
            speakingAs: (client.brandKit?.speakingAs as any) || "nosotros",
            emojiUsage: (client.brandKit?.emojiUsage as any) || "moderado",
            about: client.knowledgeBase?.about || client.description || "",
            products: (client.knowledgeBase?.products as any) || [],
            targetAudiences: (client.knowledgeBase?.targetAudiences as any) || [],
            guardrails: client.brandKit?.guardrails || [],
            forbiddenWords: client.brandKit?.forbiddenWords || [],
            requiredHashtags: client.brandKit?.requiredHashtags || [],
            forbiddenHashtags: client.brandKit?.forbiddenHashtags || [],
        };

        const monthBrief: MonthBrief = {
            month: contentMonth.month,
            year: contentMonth.year,
            primaryObjective: contentMonth.primaryObjective || undefined,
            specificGoal: contentMonth.specificGoal || undefined,
            seasonality: contentMonth.seasonality || undefined,
            relevantDates: (contentMonth.relevantDates as any) || [],
            contentPillars: (contentMonth.contentPillars as any) || [],
        };

        const plan = {
            posts: client.plan?.postsPerMonth || 12,
            carousels: client.plan?.carouselsPerMonth || 4,
            reels: client.plan?.reelsPerMonth || 4,
            stories: client.plan?.storiesPerMonth || 10,
        };

        // 3. Generate Strategy
        const strategy = await generateStrategy(brandContext, monthBrief, plan, client.workspaceId)

        // 4. Save Strategy to DB
        await prisma.contentMonth.update({
            where: { id: params.id },
            data: {
                strategy: strategy as object,
                status: 'GENERATING' // Mark as generating so UI knows
            }
        })

        // 5. Delete old pieces (fresh start)
        await prisma.contentPiece.deleteMany({ where: { contentMonthId: params.id } })

        return NextResponse.json({
            success: true,
            strategy,
            message: 'Estrategia generada correctamente'
        })

    } catch (error) {
        console.error('Error generating strategy:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Error interno' },
            { status: 500 }
        )
    }
}
