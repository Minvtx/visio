import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logActivity } from '@/lib/audit'
import { notifyAdmins } from '@/lib/notifications'

// GET /api/portal/pieces/[id] - Get a single piece for client
export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
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

        const piece = await prisma.contentPiece.findUnique({
            where: { id: params.id },
            include: {
                contentMonth: {
                    include: {
                        client: true,
                    },
                },
            },
        })

        if (!piece) {
            return NextResponse.json({ error: 'Pieza no encontrada' }, { status: 404 })
        }

        // Verify access
        if (piece.contentMonth.clientId !== user.client.id) {
            return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
        }

        // Parse copy
        let copyData: any = {}
        try {
            if (typeof piece.copy === 'string') {
                copyData = JSON.parse(piece.copy)
            } else if (typeof piece.copy === 'object' && piece.copy !== null) {
                copyData = piece.copy
            }
        } catch {
            copyData = { raw: piece.copy }
        }

        return NextResponse.json({
            id: piece.id,
            title: piece.title,
            format: piece.type,
            pillar: piece.pillar,
            copy: copyData,
            hashtags: piece.hashtags,
            visualBrief: piece.visualBrief,
            status: piece.status,
            scheduledDate: piece.suggestedDate?.toISOString(),
            feedback: piece.feedback,
            metadata: piece.metadata,
        })
    } catch (error) {
        console.error('Error fetching piece:', error)
        return NextResponse.json({ error: 'Error al obtener pieza' }, { status: 500 })
    }
}

// POST /api/portal/pieces/[id] - Approve or send feedback for a piece
export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
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

        const body = await request.json()
        const { action, feedback } = body // action: 'approve' | 'feedback'

        const piece = await prisma.contentPiece.findUnique({
            where: { id: params.id },
            include: {
                contentMonth: true,
            },
        })

        if (!piece) {
            return NextResponse.json({ error: 'Pieza no encontrada' }, { status: 404 })
        }

        // Verify access
        if (piece.contentMonth.clientId !== user.client.id) {
            return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
        }

        if (action === 'approve') {
            // Approve the piece
            const updatedPiece = await prisma.contentPiece.update({
                where: { id: params.id },
                data: {
                    status: 'APPROVED',
                    approvedAt: new Date(),
                    approvedBy: session.user.id,
                    feedback: null,
                },
            })

            // Log Activity
            await logActivity(session.user.id, 'APPROVE_PIECE', params.id, 'ContentPiece', { source: 'PORTAL' })

            // Check if all pieces are approved
            const allPieces = await prisma.contentPiece.findMany({
                where: { contentMonthId: piece.contentMonthId },
            })

            const allApproved = allPieces.every(p => p.status === 'APPROVED')

            if (allApproved) {
                await prisma.contentMonth.update({
                    where: { id: piece.contentMonthId },
                    data: { status: 'APPROVED' },
                })
                // Log Month Approval
                await logActivity(session.user.id, 'APPROVE_PIECE', piece.contentMonthId, 'ContentMonth', { source: 'PORTAL_AUTO' })
                await notifyAdmins('MONTH_APPROVED', 'Mes Aprobado', `El cliente ha aprobado todo el contenido del mes.`, piece.contentMonthId)
            } else {
                await notifyAdmins('PIECE_APPROVED', 'Pieza Aprobada', `El cliente aprobó la pieza: ${piece.title}`, piece.id)
            }

            return NextResponse.json({
                success: true,
                piece: updatedPiece,
                message: 'Pieza aprobada',
            })
        } else if (action === 'feedback') {
            // Send feedback (keeps as pending)
            const updatedPiece = await prisma.contentPiece.update({
                where: { id: params.id },
                data: {
                    status: 'PENDING_REVIEW',
                    feedback: feedback || 'El cliente solicitó cambios',
                },
            })

            // Log Activity
            await logActivity(session.user.id, 'REJECT_PIECE', params.id, 'ContentPiece', { feedback, source: 'PORTAL' })

            return NextResponse.json({
                success: true,
                piece: updatedPiece,
                message: 'Feedback enviado',
            })
        }

        return NextResponse.json({ error: 'Acción no válida' }, { status: 400 })
    } catch (error) {
        console.error('Error processing piece action:', error)
        return NextResponse.json({ error: 'Error al procesar acción' }, { status: 500 })
    }
}
