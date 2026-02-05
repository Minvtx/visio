import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/clients/[id]/knowledge
export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const knowledgeBase = await prisma.knowledgeBase.findUnique({
            where: { clientId: params.id },
        })

        return NextResponse.json(knowledgeBase)
    } catch (error) {
        console.error('Error fetching knowledge base:', error)
        return NextResponse.json({ error: 'Error al obtener knowledge base' }, { status: 500 })
    }
}

// PATCH /api/clients/[id]/knowledge
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

        // Remove id and clientId from body
        const { id, clientId, ...data } = body

        const knowledgeBase = await prisma.knowledgeBase.upsert({
            where: { clientId: params.id },
            update: data,
            create: {
                clientId: params.id,
                ...data
            },
        })

        return NextResponse.json(knowledgeBase)
    } catch (error) {
        console.error('Error updating knowledge base:', error)
        return NextResponse.json({ error: 'Error al actualizar knowledge base' }, { status: 500 })
    }
}
