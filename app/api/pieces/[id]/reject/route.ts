import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/pieces/[id]/reject - Reject a content piece with feedback
export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const body = await request.json()
        const { feedback } = body

        const piece = await prisma.contentPiece.findUnique({
            where: { id: params.id },
            include: {
                contentMonth: {
                    include: {
                        client: {
                            include: {
                                users: true,
                            },
                        },
                    },
                },
            },
        })

        if (!piece) {
            return NextResponse.json({ error: 'Pieza no encontrada' }, { status: 404 })
        }

        // Check if client user has access
        if (session.user.role === 'CLIENT') {
            const hasAccess = piece.contentMonth.client.users.some(
                (u) => u.id === session.user.id
            )
            if (!hasAccess) {
                return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
            }
        }

        // Update piece with feedback and set to DRAFT for revision
        const updatedPiece = await prisma.contentPiece.update({
            where: { id: params.id },
            data: {
                status: 'DRAFT',
                feedback: feedback || 'Rechazado - requiere cambios',
                approvedAt: null,
                approvedBy: null,
            },
        })

        // Update month status if needed
        await prisma.contentMonth.update({
            where: { id: piece.contentMonthId },
            data: { status: 'IN_REVIEW' },
        })

        return NextResponse.json(updatedPiece)
    } catch (error) {
        console.error('Error rejecting piece:', error)
        return NextResponse.json({ error: 'Error al rechazar pieza' }, { status: 500 })
    }
}
