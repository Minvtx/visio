import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/pieces/[id]/comments - List comments
export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const comments = await prisma.comment.findMany({
            where: { pieceId: params.id },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        role: true,
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json(comments)
    } catch (error) {
        console.error('Error fetching comments:', error)
        return NextResponse.json({ error: 'Error al obtener comentarios' }, { status: 500 })
    }
}

// POST /api/pieces/[id]/comments - Create comment
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
        const { content, quotedText, blockId } = body

        if (!content) {
            return NextResponse.json({ error: 'El contenido es requerido' }, { status: 400 })
        }

        const comment = await prisma.comment.create({
            data: {
                pieceId: params.id,
                userId: session.user.id,
                content,
                quotedText,
                blockId,
                status: 'OPEN'
            },
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
        console.error('Error creating comment:', error)
        return NextResponse.json({ error: 'Error al crear comentario' }, { status: 500 })
    }
}
