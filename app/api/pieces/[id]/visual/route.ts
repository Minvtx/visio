import { NextResponse } from 'next/server'
export const maxDuration = 60; // Vercel Pro
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { visualWizard, type BrandVisualKit } from '@/lib/agents/visual-wizard'
import { type GeneratedPiece } from '@/lib/agents/content-wizard'

// POST /api/pieces/[id]/visual - Generate visual design for a piece
export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        // Get the piece with client info
        const piece = await prisma.contentPiece.findUnique({
            where: { id: params.id },
            include: {
                contentMonth: {
                    include: {
                        client: {
                            include: {
                                brandKit: true,
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
        const brandKit = client.brandKit

        // Build visual kit from brand kit
        const visualKit: BrandVisualKit = {
            primaryColors: (brandKit?.colorPalette as any)?.primary || ['#6366F1', '#8B5CF6'],
            secondaryColors: (brandKit?.colorPalette as any)?.secondary || ['#1F2937', '#F3F4F6'],
            fonts: {
                heading: (brandKit?.typography as any)?.heading || 'Outfit',
                body: (brandKit?.typography as any)?.body || 'Inter',
            },
            style: brandKit?.tone || 'Moderno y profesional',
        }

        // Parse the copy JSON stored in the piece
        const copy = piece.copy as any

        // Convert DB piece to GeneratedPiece format
        const generatedPiece: GeneratedPiece = {
            dayOfMonth: piece.suggestedDate?.getDate() || 1,
            format: piece.type as any,
            pillar: piece.pillar || 'General',
            topic: piece.title,
            objective: (piece.metadata as any)?.objective || 'ENGAGEMENT',
            hooks: copy?.hooks || [{ text: piece.title, style: 'statement' }],
            captionLong: copy?.captionLong || '',
            captionShort: copy?.captionShort || '',
            ctas: copy?.ctas || [],
            hashtags: piece.hashtags || [],
            suggestedTime: (piece.metadata as any)?.suggestedTime || '12:00',
            visualConcept: piece.visualBrief || '',
            carouselSlides: (piece.metadata as any)?.carouselSlides,
        }

        // Generate visual with Visual Wizard
        const visualOutput = await visualWizard.generateVisual(generatedPiece, visualKit)

        // Update piece with visual data
        await prisma.contentPiece.update({
            where: { id: params.id },
            data: {
                visualBrief: JSON.stringify(visualOutput),
            },
        })

        return NextResponse.json({
            success: true,
            visual: visualOutput,
        })
    } catch (error) {
        console.error('Error generating visual:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Error al generar visual' },
            { status: 500 }
        )
    }
}
