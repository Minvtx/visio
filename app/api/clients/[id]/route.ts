import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Schema for client update
const updateClientSchema = z.object({
    name: z.string().min(2).optional(),
    industry: z.string().optional(),
    description: z.string().optional(),
    country: z.string().optional(),
    city: z.string().optional(),
    dialect: z.string().optional(),
})

// GET /api/clients/[id] - Get single client with all details
export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const client = await prisma.client.findUnique({
            where: { id: params.id },
            include: {
                brandKit: true,
                knowledgeBase: true,
                plan: true,
                contentMonths: {
                    orderBy: [{ year: 'desc' }, { month: 'desc' }],
                    take: 6,
                    include: {
                        _count: {
                            select: { pieces: true },
                        },
                    },
                },
                _count: {
                    select: {
                        assets: true,
                        users: true,
                    },
                },
            },
        })

        if (!client) {
            return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })
        }

        // Check access: admin can see all, client can only see their own
        if (session.user.role === 'CLIENT' && session.user.clientId !== client.id) {
            return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
        }

        return NextResponse.json(client)
    } catch (error) {
        console.error('Error fetching client:', error)
        return NextResponse.json({ error: 'Error al obtener cliente' }, { status: 500 })
    }
}

// PATCH /api/clients/[id] - Update client
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
        const validation = updateClientSchema.safeParse(body)

        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error.errors[0].message },
                { status: 400 }
            )
        }

        const client = await prisma.client.update({
            where: { id: params.id },
            data: validation.data,
            include: {
                brandKit: true,
                knowledgeBase: true,
            },
        })

        return NextResponse.json(client)
    } catch (error) {
        console.error('Error updating client:', error)
        return NextResponse.json({ error: 'Error al actualizar cliente' }, { status: 500 })
    }
}

// DELETE /api/clients/[id] - Delete client
export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        await prisma.client.delete({
            where: { id: params.id },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting client:', error)
        return NextResponse.json({ error: 'Error al eliminar cliente' }, { status: 500 })
    }
}
