import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/portal/content - Get current month content for client
export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        // Get client associated with user
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            include: {
                client: true,
            },
        })

        if (!user?.client) {
            return NextResponse.json({ error: 'No tienes un cliente asociado' }, { status: 403 })
        }

        const clientId = user.client.id

        // Get the most recent content month that is ready for review
        const { searchParams } = new URL(request.url)
        const monthId = searchParams.get('monthId')

        let contentMonth
        if (monthId) {
            contentMonth = await prisma.contentMonth.findFirst({
                where: {
                    id: monthId,
                    clientId,
                },
                include: {
                    pieces: {
                        orderBy: { order: 'asc' },
                    },
                    client: {
                        select: {
                            name: true,
                            slug: true,
                        },
                    },
                },
            })
        } else {
            // Get the most recent month with content
            contentMonth = await prisma.contentMonth.findFirst({
                where: {
                    clientId,
                    status: { in: ['GENERATED', 'IN_REVIEW', 'APPROVED', 'LOCKED'] },
                },
                orderBy: [{ year: 'desc' }, { month: 'desc' }],
                include: {
                    pieces: {
                        orderBy: { order: 'asc' },
                    },
                    client: {
                        select: {
                            name: true,
                            slug: true,
                        },
                    },
                },
            })
        }

        if (!contentMonth) {
            return NextResponse.json({
                hasContent: false,
                message: 'No hay contenido disponible para revisar',
            })
        }

        // Calculate stats
        const totalPieces = contentMonth.pieces.length
        const approvedCount = contentMonth.pieces.filter(p => p.status === 'APPROVED').length
        const pendingCount = contentMonth.pieces.filter(p => p.status !== 'APPROVED').length

        const MONTH_NAMES = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

        return NextResponse.json({
            hasContent: true,
            month: {
                id: contentMonth.id,
                name: `${MONTH_NAMES[contentMonth.month]} ${contentMonth.year}`,
                month: contentMonth.month,
                year: contentMonth.year,
                status: contentMonth.status,
            },
            client: contentMonth.client,
            stats: {
                total: totalPieces,
                approved: approvedCount,
                pending: pendingCount,
                progress: totalPieces > 0 ? Math.round((approvedCount / totalPieces) * 100) : 0,
            },
            pieces: contentMonth.pieces.map(piece => {
                // Parse copy for display
                let copyShort = ''
                try {
                    if (typeof piece.copy === 'string') {
                        const parsed = JSON.parse(piece.copy)
                        copyShort = parsed.captionShort || parsed.captionLong?.slice(0, 150) || piece.copy
                    } else if (typeof piece.copy === 'object' && piece.copy !== null) {
                        copyShort = (piece.copy as any).captionShort || (piece.copy as any).captionLong?.slice(0, 150) || ''
                    }
                } catch {
                    copyShort = String(piece.copy || '').slice(0, 150)
                }

                return {
                    id: piece.id,
                    title: piece.title,
                    format: piece.type,
                    pillar: piece.pillar,
                    copyShort,
                    status: piece.status,
                    scheduledDate: piece.suggestedDate?.toISOString(),
                    feedback: piece.feedback,
                }
            }),
        })
    } catch (error) {
        console.error('Error fetching portal content:', error)
        return NextResponse.json({ error: 'Error al obtener contenido' }, { status: 500 })
    }
}
