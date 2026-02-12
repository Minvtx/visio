import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateSinglePiece, type PieceRequest } from '@/lib/agents/piece-generator'
import type { BrandContext, MonthBrief } from '@/lib/agents/content-generator'

export const maxDuration = 30

export async function POST(
    request: NextRequest
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const body = await request.json()
        const { monthId, assignment, pieceIndex, totalPieces } = body

        if (!monthId || !assignment) {
            return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 })
        }

        // 1. Fetch Context again (stateless)
        // Optimization: Could pass context from client, but safer to fetch
        const contentMonth = await prisma.contentMonth.findUnique({
            where: { id: monthId },
            include: {
                client: {
                    include: { brandKit: true, knowledgeBase: true },
                },
            },
        })

        if (!contentMonth) return NextResponse.json({ error: 'Mes no encontrado' }, { status: 404 })

        const client = contentMonth.client

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
        }

        const monthBrief: MonthBrief = {
            month: contentMonth.month,
            year: contentMonth.year,
            primaryObjective: contentMonth.primaryObjective || undefined,
            specificGoal: contentMonth.specificGoal || undefined,
            seasonality: contentMonth.seasonality || undefined,
            relevantDates: (contentMonth.relevantDates as any) || [],
            contentPillars: (contentMonth.contentPillars as any) || [],
        }

        const req: PieceRequest = {
            brand: brandContext,
            brief: monthBrief,
            format: assignment.format,
            pillar: assignment.pillar,
            dayOfMonth: assignment.dayOfMonth,
            pieceNumber: pieceIndex + 1,
            totalPieces: totalPieces,
        }

        // 2. Generate Piece
        const piece = await generateSinglePiece(req, client.workspaceId)

        // 3. Save to DB
        const saved = await prisma.contentPiece.create({
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
                suggestedDate: new Date(contentMonth.year, contentMonth.month - 1, piece.dayOfMonth),
                status: "DRAFT",
                order: pieceIndex,
                metadata: {
                    carouselSlides: piece.carouselSlides || null,
                } as object,
            },
        })

        return NextResponse.json({
            success: true,
            pieceId: saved.id
        })

    } catch (error) {
        console.error('Error generating piece:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Error interno' },
            { status: 500 }
        )
    }
}
