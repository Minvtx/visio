import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PATCH /api/comments/[id] - Update/Resolve comment
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
        const { content, status } = body

        // Check ownership or admin
        const existingComment = await prisma.comment.findUnique({
            where: { id: params.id }
        })

        if (!existingComment) {
            return NextResponse.json({ error: 'Comentario no encontrado' }, { status: 404 })
        }

        // Only author can edit content, but admins/reviewers can resolve
        if (content && existingComment.userId !== session.user.id) {
            return NextResponse.json({ error: 'No puedes editar este comentario' }, { status: 403 })
        }

        const data: any = {}
        if (content) data.content = content
        if (status) {
            data.status = status
            if (status === 'RESOLVED') {
                data.resolvedAt = new Date()
            } else if (status === 'OPEN') {
                data.resolvedAt = null
            }
        }

        const comment = await prisma.comment.update({
            where: { id: params.id },
            data,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                    }
                }
            }
        })

        return NextResponse.json(comment)
    } catch (error) {
        console.error('Error updating comment:', error)
        return NextResponse.json({ error: 'Error al actualizar comentario' }, { status: 500 })
    }
}

// DELETE /api/comments/[id]
export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const existingComment = await prisma.comment.findUnique({
            where: { id: params.id }
        })

        if (!existingComment) {
            return NextResponse.json({ error: 'Comentario no encontrado' }, { status: 404 })
        }

        if (existingComment.userId !== session.user.id && session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
        }

        await prisma.comment.delete({
            where: { id: params.id }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting comment:', error)
        return NextResponse.json({ error: 'Error al eliminar comentario' }, { status: 500 })
    }
}
