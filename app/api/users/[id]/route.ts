import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Schema for user update
const updateUserSchema = z.object({
    name: z.string().min(2).optional(),
    role: z.enum(['ADMIN', 'CLIENT']).optional(),
    clientId: z.string().nullable().optional(),
})

// GET /api/users/[id] - Get single user
export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const user = await prisma.user.findUnique({
            where: { id: params.id },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                clientId: true,
                client: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                createdAt: true,
            },
        })

        if (!user) {
            return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
        }

        return NextResponse.json(user)
    } catch (error) {
        console.error('Error fetching user:', error)
        return NextResponse.json({ error: 'Error al obtener usuario' }, { status: 500 })
    }
}

// PATCH /api/users/[id] - Update user (change role, name, etc.)
export async function PATCH(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        // Prevent admin from demoting themselves
        if (params.id === session.user.id) {
            return NextResponse.json(
                { error: 'No puedes modificar tu propio rol' },
                { status: 400 }
            )
        }

        const body = await request.json()
        const validation = updateUserSchema.safeParse(body)

        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error.errors[0].message },
                { status: 400 }
            )
        }

        const { name, role, clientId } = validation.data

        // If changing to CLIENT, clientId is required
        if (role === 'CLIENT' && clientId === undefined) {
            return NextResponse.json(
                { error: 'Debes asignar un cliente al cambiar a rol CLIENT' },
                { status: 400 }
            )
        }

        const user = await prisma.user.update({
            where: { id: params.id },
            data: {
                ...(name && { name }),
                ...(role && { role }),
                ...(role === 'ADMIN' ? { clientId: null } : { clientId }),
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                clientId: true,
            },
        })

        return NextResponse.json(user)
    } catch (error) {
        console.error('Error updating user:', error)
        return NextResponse.json({ error: 'Error al actualizar usuario' }, { status: 500 })
    }
}

// DELETE /api/users/[id] - Delete user
export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        // Prevent self-deletion
        if (params.id === session.user.id) {
            return NextResponse.json(
                { error: 'No puedes eliminarte a ti mismo' },
                { status: 400 }
            )
        }

        await prisma.user.delete({
            where: { id: params.id },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting user:', error)
        return NextResponse.json({ error: 'Error al eliminar usuario' }, { status: 500 })
    }
}
