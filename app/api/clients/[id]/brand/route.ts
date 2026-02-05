import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/clients/[id]/brand
export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const brandKit = await prisma.brandKit.findUnique({
            where: { clientId: params.id },
        })

        return NextResponse.json(brandKit)
    } catch (error) {
        console.error('Error fetching brand kit:', error)
        return NextResponse.json({ error: 'Error al obtener brand kit' }, { status: 500 })
    }
}

// PATCH /api/clients/[id]/brand
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

        // Remove id and clientId from body to prevent overwrite errors
        const { id, clientId, ...data } = body

        const brandKit = await prisma.brandKit.upsert({
            where: { clientId: params.id },
            update: data,
            create: {
                clientId: params.id,
                tone: data.tone || 'Profesional',
                ...data
            },
        })

        return NextResponse.json(brandKit)
    } catch (error) {
        console.error('Error updating brand kit:', error)
        return NextResponse.json({ error: 'Error al actualizar brand kit' }, { status: 500 })
    }
}
