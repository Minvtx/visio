import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { googleServices } from '@/lib/google-services'

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
        const contentMonth = await prisma.contentMonth.findUnique({
            where: { id: monthId },
            include: {
                pieces: {
                    where: {
                        suggestedDate: { not: null },
                    },
                },
                client: true,
            },
        })

        if (!contentMonth) {
            return NextResponse.json({ error: 'Mes no encontrado' }, { status: 404 })
        }

        console.log(`[CalendarSync] Syncing ${contentMonth.pieces.length} pieces for ${contentMonth.client.name}...`)

        const results = []
        for (const piece of contentMonth.pieces) {
            if (!piece.suggestedDate) continue

            // Create a 1-hour event for each piece
            const start = new Date(piece.suggestedDate)
            start.setHours(12, 0, 0, 0) // Default to noon

            const end = new Date(start)
            end.setHours(13, 0, 0, 0)

            try {
                const event = await googleServices.createCalendarEvent(session.user.id, {
                    summary: `[VISIO] ${piece.type}: ${piece.title}`,
                    description: `Contenido para ${contentMonth.client.name}\nFormato: ${piece.type}\nPilar: ${piece.pillar || 'N/A'}\n\nRevisa el contenido en el dashboard de Visio.`,
                    start,
                    end,
                    addMeetLink: piece.pillar === 'STRATEGIC' || piece.type === 'REEL', // Heuristic for adding meet links
                })
                results.push({ pieceId: piece.id, eventId: event.id, success: true })
            } catch (error: any) {
                console.error(`[CalendarSync] Error syncing piece ${piece.id}:`, error.message)
                results.push({ pieceId: piece.id, error: error.message, success: false })
            }
        }

        return NextResponse.json({
            success: true,
            processed: results.length,
            results,
        })

    } catch (error) {
        console.error('[CalendarSync] Fatal error:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Error interno al sincronizar' },
            { status: 500 }
        )
    }
}
