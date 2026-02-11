import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/months/[id]/reset - Reset a stuck month back to DRAFT
 * Clears all pieces and resets status
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

        const month = await prisma.contentMonth.findUnique({
            where: { id: params.id },
        })

        if (!month) {
            return NextResponse.json({ error: 'Mes no encontrado' }, { status: 404 })
        }

        // Delete all existing pieces
        const deleted = await prisma.contentPiece.deleteMany({
            where: { contentMonthId: params.id }
        })

        // Reset month status to DRAFT
        await prisma.contentMonth.update({
            where: { id: params.id },
            data: {
                status: 'DRAFT',
                generatedAt: null,
            }
        })

        // Mark any stuck jobs as failed
        await prisma.job.updateMany({
            where: {
                payload: { path: ['monthId'], equals: params.id },
                status: { in: ['QUEUED', 'RUNNING'] }
            },
            data: { status: 'FAILED' }
        })

        return NextResponse.json({
            success: true,
            piecesDeleted: deleted.count,
            message: 'Mes reseteado a borrador'
        })

    } catch (error) {
        console.error('Error resetting month:', error)
        return NextResponse.json({ error: 'Error al resetear' }, { status: 500 })
    }
}
