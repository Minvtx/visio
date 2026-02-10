import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PATCH /api/clients/[id]/knowledge-base - Update knowledge base
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    try {
        const body = await request.json()
        const {
            about,
            mission,
            uniqueValue,
            targetAudience,
            products,
            competitors
        } = body

        // Get client to verify ownership
        const client = await prisma.client.findUnique({
            where: { id: params.id },
            include: { knowledgeBase: true }
        })

        if (!client || client.workspaceId !== session.user.workspaceId) {
            return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })
        }

        // Update or create knowledge base - using schema fields
        const updatedKnowledgeBase = await prisma.knowledgeBase.upsert({
            where: { clientId: params.id },
            update: {
                about: about || '',
                history: mission || null,
                targetAudience: targetAudience || null,
                targetAudiences: targetAudience || null,
                products: products || null,
                competitors: competitors || [],
                customFields: uniqueValue ? { uniqueValue } : null as any,
            },
            create: {
                clientId: params.id,
                about: about || '',
                history: mission || null,
                targetAudience: targetAudience || null,
                targetAudiences: targetAudience || null,
                products: products || null,
                competitors: competitors || [],
                customFields: uniqueValue ? { uniqueValue } : null as any,
            },
        })

        return NextResponse.json(updatedKnowledgeBase)
    } catch (error) {
        console.error('Error updating knowledge base:', error)
        return NextResponse.json({ error: 'Error al actualizar knowledge base' }, { status: 500 })
    }
}
