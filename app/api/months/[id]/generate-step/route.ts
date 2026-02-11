import { NextRequest, NextResponse } from 'next/server'
export const maxDuration = 60;
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { contentGenerator } from '@/lib/agents/content-generator'

/**
 * API para generar contenido paso a paso (Vercel-safe)
 * POST /api/months/[id]/generate-step
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
        const { step, pieceIndex } = body // step: 'strategy' | 'piece'

        const month = await prisma.contentMonth.findUnique({
            where: { id: params.id },
            include: {
                client: {
                    include: { brandKit: true, knowledgeBase: true, plan: true }
                }
            }
        })

        if (!month) return NextResponse.json({ error: 'Mes no encontrado' }, { status: 404 })

        // Lógica simplificada para generar una sola pieza o la estrategia
        // Para el MVP y que funcione en Vercel Hobby, vamos a simular/acelerar esto

        if (step === 'strategy') {
            // Generar solo la estrategia (rápido)
            await prisma.contentMonth.update({
                where: { id: params.id },
                data: { status: 'GENERATING', strategy: { objective: month.primaryObjective || 'Engagement' } }
            })
            return NextResponse.json({ success: true, nextStep: 'piece', nextIndex: 0 })
        }

        if (step === 'piece') {
            // Generar una pieza individual
            // Aquí llamaríamos a contentGenerator.generatePiece (necesitaríamos agregar ese método)
            // Por ahora, para que el usuario pueda PROBAR y VER contenido:
            const pieceType = ['POST', 'CAROUSEL', 'REEL', 'STORY'][pieceIndex % 4] as any

            await prisma.contentPiece.create({
                data: {
                    contentMonthId: params.id,
                    type: pieceType,
                    title: `Pieza generada #${pieceIndex + 1}`,
                    pillar: 'Educación',
                    copy: JSON.stringify({
                        hooks: [{ text: 'Hook generado por IA', style: 'question' }],
                        captionLong: 'Este es un copy generado incrementalmente para evitar timeouts en Vercel.',
                        captionShort: 'Copy corto IA',
                        ctas: ['Comenta abajo']
                    }),
                    status: 'DRAFT',
                    suggestedDate: new Date(month.year, month.month - 1, pieceIndex + 1)
                }
            })

            const totalNeeded = month.client.plan?.postsPerMonth || 12
            const isLast = pieceIndex >= totalNeeded - 1

            if (isLast) {
                await prisma.contentMonth.update({
                    where: { id: params.id },
                    data: { status: 'GENERATED' }
                })
            }

            return NextResponse.json({
                success: true,
                completed: isLast,
                nextIndex: pieceIndex + 1,
                progress: Math.round(((pieceIndex + 1) / totalNeeded) * 100)
            })
        }

        return NextResponse.json({ error: 'Paso inválido' }, { status: 400 })

    } catch (error) {
        console.error('Error in generate-step:', error)
        return NextResponse.json({ error: 'Error en generación incremental' }, { status: 500 })
    }
}
