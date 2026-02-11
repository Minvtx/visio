import { NextRequest, NextResponse } from 'next/server'
export const maxDuration = 60;
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { contentWizard } from '@/lib/agents/content-wizard-v2'
import type { BrandContext, GeneratedPiece } from '@/lib/agents/content-wizard-v2'

// POST /api/pieces/[id]/regenerate - Regenerate specific parts of a piece using modular skills
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
        const { target, feedback } = body // target: 'hook' | 'copy' | 'hashtags' | 'visual' | 'cta' | 'humanize' | 'optimize'

        if (!['hook', 'copy', 'hashtags', 'visual', 'cta', 'all', 'humanize', 'optimize'].includes(target)) {
            return NextResponse.json({ error: 'Target inválido' }, { status: 400 })
        }

        // Get piece with client context
        const piece = await prisma.contentPiece.findUnique({
            where: { id: params.id },
            include: {
                contentMonth: {
                    include: {
                        client: {
                            include: {
                                brandKit: true,
                                knowledgeBase: true,
                            },
                        },
                    },
                },
            },
        })

        if (!piece) {
            return NextResponse.json({ error: 'Pieza no encontrada' }, { status: 404 })
        }

        const { client } = piece.contentMonth

        // Build brand context for the new system
        const brandContext: BrandContext = {
            name: client.name,
            industry: client.industry || 'General',
            primaryTone: client.brandKit?.primaryTone || client.brandKit?.tone || 'Profesional pero cercano',
            about: client.knowledgeBase?.about || client.description || '',
            brandPersonality: client.brandKit?.brandPersonality || [],
            brandArchetype: client.brandKit?.brandArchetype || undefined,
            guardrails: client.brandKit?.guardrails || [],
            forbiddenWords: client.brandKit?.forbiddenWords || [],
            requiredHashtags: client.brandKit?.requiredHashtags || [],
            forbiddenHashtags: client.brandKit?.forbiddenHashtags || [],
        }

        // Parse current copy
        let currentCopy: any = {}
        try {
            if (typeof piece.copy === 'string') {
                currentCopy = JSON.parse(piece.copy)
            } else if (typeof piece.copy === 'object' && piece.copy !== null) {
                currentCopy = piece.copy
            }
        } catch {
            currentCopy = {}
        }

        // Build existing piece object
        const existingPiece: GeneratedPiece = {
            dayOfMonth: piece.suggestedDate ? new Date(piece.suggestedDate).getDate() : 1,
            format: piece.type as 'POST' | 'CAROUSEL' | 'REEL' | 'STORY',
            pillar: piece.pillar || 'General',
            topic: piece.title,
            objective: (piece.metadata as any)?.objective || 'ENGAGEMENT',
            hooks: currentCopy.hooks || [{ text: piece.title, style: 'statement' }],
            captionLong: currentCopy.captionLong || '',
            captionShort: currentCopy.captionShort || '',
            ctas: currentCopy.ctas || [],
            hashtags: piece.hashtags || [],
            suggestedTime: (piece.metadata as any)?.suggestedTime || '12:00',
            visualConcept: piece.visualBrief || '',
            carouselSlides: (piece.metadata as any)?.carouselSlides || undefined,
        }

        let result: any = {}
        let tokensUsed = 0

        if (target === 'all') {
            // Regenerate entire piece
            const regenerated = await contentWizard.regeneratePiece(
                brandContext,
                existingPiece,
                { feedback }
            )
            result = {
                hooks: regenerated.hooks,
                captionLong: regenerated.captionLong,
                captionShort: regenerated.captionShort,
                ctas: regenerated.ctas,
                hashtags: regenerated.hashtags,
                visualConcept: regenerated.visualConcept,
                carouselSlides: regenerated.carouselSlides,
            }
        } else {
            // Regenerate specific element using the new modular approach
            const elementResult = await contentWizard.regenerateElement(
                brandContext,
                existingPiece,
                target as any
            )

            // Format result based on target for backwards compatibility
            switch (target) {
                case 'hook':
                    result = {
                        hooks: elementResult.hooks || [],
                        recommended: 0,
                    }
                    break
                case 'copy':
                    result = {
                        captionLong: elementResult.captionLong || '',
                        captionShort: elementResult.captionShort || '',
                        ctas: existingPiece.ctas.map(c => ({ text: c, type: 'medium' })),
                    }
                    break
                case 'hashtags':
                    const hashtags = elementResult.hashtags || existingPiece.hashtags
                    result = {
                        hashtags: hashtags.map((h: string) => h.startsWith('#') ? h : `#${h}`),
                        strategy: 'Mix of branded, niche, and broad hashtags for optimal reach',
                    }
                    break
                case 'visual':
                    result = {
                        concept: elementResult.visualConcept || '',
                        mood: 'Professional yet approachable',
                        keyElements: [],
                        colorScheme: 'Brand colors',
                        aiPrompt: elementResult.visualConcept || '',
                        designerNotes: 'Follow brand guidelines',
                    }
                    break
                case 'cta':
                    result = {
                        ctas: elementResult.ctas?.map((c: string) => ({ text: c, type: 'medium' })) || [],
                    }
                    break
                case 'humanize':
                case 'optimize':
                    result = {
                        captionLong: elementResult.captionLong || '',
                        captionShort: elementResult.captionShort || '',
                    }
                    break
            }
        }

        // Log the generation run
        try {
            await prisma.generationRun.create({
                data: {
                    skillId: target === 'all' ? 'regenerate_piece' : `${target}_variants`,
                    input: { target, pieceId: params.id, feedback },
                    output: result,
                    tokensUsed,
                    contentPieceId: params.id,
                },
            })
        } catch (dbError) {
            console.error('Failed to log regeneration:', dbError)
        }

        return NextResponse.json({
            success: true,
            target,
            result,
            tokensUsed,
        })
    } catch (error) {
        console.error('Error regenerating piece:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Error al regenerar' },
            { status: 500 }
        )
    }
}
