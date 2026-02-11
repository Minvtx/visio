import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET /api/months/[id] - Get a content month with all pieces
export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const month = await prisma.contentMonth.findUnique({
            where: { id: params.id },
            include: {
                client: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        industry: true,
                        country: true,
                        city: true,
                        dialect: true,
                    },
                },
                pieces: {
                    orderBy: { order: 'asc' },
                },
                _count: {
                    select: { pieces: true },
                },
            },
        })

        if (!month) {
            return NextResponse.json({ error: 'Mes no encontrado' }, { status: 404 })
        }

        // Check access for clients
        if (session.user.role === 'CLIENT') {
            const client = await prisma.client.findFirst({
                where: {
                    id: month.clientId,
                    users: { some: { id: session.user.id } },
                },
            })
            if (!client) {
                return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
            }
        }

        return NextResponse.json(month)
    } catch (error) {
        console.error('Error fetching month:', error)
        return NextResponse.json({ error: 'Error al obtener mes' }, { status: 500 })
    }
}

// PATCH /api/months/[id] - Update month status
export async function PATCH(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const body = await request.json()
        const { status } = body

        const validStatuses = ['DRAFT', 'GENERATED', 'IN_REVIEW', 'APPROVED', 'LOCKED', 'EXPORTED']
        if (status && !validStatuses.includes(status)) {
            return NextResponse.json({ error: 'Estado inválido' }, { status: 400 })
        }

        const month = await prisma.contentMonth.update({
            where: { id: params.id },
            data: {
                ...(status && { status }),
            },
        })

        return NextResponse.json(month)
    } catch (error) {
        console.error('Error updating month:', error)
        return NextResponse.json({ error: 'Error al actualizar mes' }, { status: 500 })
    }
}

// DELETE /api/months/[id] - Delete a content month
export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        // First delete all pieces
        await prisma.contentPiece.deleteMany({
            where: { contentMonthId: params.id },
        })

        // Then delete the month
        await prisma.contentMonth.delete({
            where: { id: params.id },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting month:', error)
        return NextResponse.json({ error: 'Error al eliminar mes' }, { status: 500 })
    }
}
