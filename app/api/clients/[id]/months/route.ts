import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Schema for content month creation
const createMonthSchema = z.object({
    month: z.number().min(1).max(12),
    year: z.number().min(2024).max(2030),
    postsCount: z.number().default(12),
    carouselsCount: z.number().default(4),
    reelsCount: z.number().default(4),
    storiesCount: z.number().default(10),
})

// GET /api/clients/[id]/months - List content months for a client
export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const months = await prisma.contentMonth.findMany({
            where: { clientId: params.id },
            orderBy: [{ year: 'desc' }, { month: 'desc' }],
            include: {
                _count: {
                    select: { pieces: true },
                },
            },
        })

        return NextResponse.json(months)
    } catch (error) {
        console.error('Error listing months:', error)
        return NextResponse.json({ error: 'Error al listar meses' }, { status: 500 })
    }
}

// POST /api/clients/[id]/months - Create a new content month
export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const body = await request.json()
        const validation = createMonthSchema.safeParse(body)

        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error.errors[0].message },
                { status: 400 }
            )
        }

        const { month, year, postsCount, carouselsCount, reelsCount, storiesCount } = validation.data

        // Check if month already exists
        const existingMonth = await prisma.contentMonth.findFirst({
            where: {
                clientId: params.id,
                month,
                year,
            },
        })

        if (existingMonth) {
            return NextResponse.json(
                { error: 'Ya existe un mes de contenido para este período' },
                { status: 400 }
            )
        }

        // Create content month
        const contentMonth = await prisma.contentMonth.create({
            data: {
                clientId: params.id,
                month,
                year,
                status: 'DRAFT',
                strategy: {},
                // Store plan in strategy for now
            },
        })

        return NextResponse.json(contentMonth, { status: 201 })
    } catch (error) {
        console.error('Error creating month:', error)
        return NextResponse.json({ error: 'Error al crear mes' }, { status: 500 })
    }
}
