import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * API de Emergencia para resetear un mes trabado
 * POST /api/months/[id]/reset
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

        // Devolver a DRAFT y limpiar Jobs pendientes para este recurso
        await prisma.$transaction([
            prisma.contentMonth.update({
                where: { id: params.id },
                data: { status: 'DRAFT' }
            }),
            prisma.job.updateMany({
                where: {
                    resourceId: params.id,
                    status: { in: ['QUEUED', 'RUNNING'] }
                },
                data: { status: 'FAILED', error: 'Reset manual del usuario' }
            })
        ]);

        return NextResponse.json({ success: true, message: 'Estado reseteado correctamente' })

    } catch (error) {
        console.error('Error resetting month:', error)
        return NextResponse.json({ error: 'Error al resetear' }, { status: 500 })
    }
}
