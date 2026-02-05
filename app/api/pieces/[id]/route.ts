import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/pieces/[id] - Get a single content piece
export async function GET(
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
                    select: {
                        id: true,
                        month: true,
                        year: true,
                        clientId: true,
                        client: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },
                assets: true,
            },
        })

        if (!piece) {
            return NextResponse.json({ error: 'Pieza no encontrada' }, { status: 404 })
        }

        return NextResponse.json(piece)
    } catch (error) {
        console.error('Error fetching piece:', error)
        return NextResponse.json({ error: 'Error al obtener pieza' }, { status: 500 })
    }
}

import { snapshotPiece } from '@/lib/versioning'

// PATCH /api/pieces/[id] - Update a content piece
export async function PATCH(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const body = await request.json()
        const { title, copy, hashtags, visualBrief, status, feedback, snapshot, changelog } = body

        // If snapshot requested, save current state as a version BEFORE updating
        if (snapshot) {
            try {
                await snapshotPiece(params.id, session.user.id, changelog || 'Actualización manual')
            } catch (err) {
                console.error('Error creating snapshot:', err)
                // We typically continue even if snapshot fails, or throw? Let's log and continue for now, or warn.
            }
        }

        // Build update data
        const updateData: any = {}
        if (title !== undefined) updateData.title = title
        if (copy !== undefined) updateData.copy = copy
        if (hashtags !== undefined) updateData.hashtags = hashtags
        if (visualBrief !== undefined) updateData.visualBrief = visualBrief
        if (status !== undefined) updateData.status = status
        if (feedback !== undefined) updateData.feedback = feedback

        const piece = await prisma.contentPiece.update({
            where: { id: params.id },
            data: updateData,
        })

        return NextResponse.json(piece)
    } catch (error) {
        console.error('Error updating piece:', error)
        return NextResponse.json({ error: 'Error al actualizar pieza' }, { status: 500 })
    }
}

// DELETE /api/pieces/[id] - Delete a content piece
export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        await prisma.contentPiece.delete({
            where: { id: params.id },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting piece:', error)
        return NextResponse.json({ error: 'Error al eliminar pieza' }, { status: 500 })
    }
}
