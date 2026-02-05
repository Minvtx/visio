import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/pieces/[id]/approve - Approve a content piece (for clients)
export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

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

        // Update piece status to approved
        const updatedPiece = await prisma.contentPiece.update({
            where: { id: params.id },
            data: {
                status: 'APPROVED',
                approvedAt: new Date(),
            },
        })

        // Check if all pieces are approved
        const allPieces = await prisma.contentPiece.findMany({
            where: { contentMonthId: piece.contentMonthId },
        })

        const allApproved = allPieces.every((p) => p.status === 'APPROVED')

        if (allApproved) {
            await prisma.contentMonth.update({
                where: { id: piece.contentMonthId },
                data: { status: 'APPROVED' },
            })
        } else {
            // At least one piece is in review
            const hasApproved = allPieces.some((p) => p.status === 'APPROVED')
            if (hasApproved) {
                await prisma.contentMonth.update({
                    where: { id: piece.contentMonthId },
                    data: { status: 'IN_REVIEW' },
                })
            }
        }

        return NextResponse.json(updatedPiece)
    } catch (error) {
        console.error('Error approving piece:', error)
        return NextResponse.json({ error: 'Error al aprobar pieza' }, { status: 500 })
    }
}
