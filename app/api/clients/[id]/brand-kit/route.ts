import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PATCH /api/clients/[id]/brand-kit - Update brand kit
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
            tone,
            personality,
            guardrails,
            forbiddenWords,
            requiredHashtags,
            samplePhrases,
            valueProposition,
        } = body

        // Get client to verify ownership
        const client = await prisma.client.findUnique({
            where: { id: params.id },
            include: { brandKit: true }
        })

        if (!client || client.workspaceId !== session.user.workspaceId) {
            return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })
        }

        // Update or create brand kit
        const updatedBrandKit = await prisma.brandKit.upsert({
            where: { clientId: params.id },
            update: {
                tone: tone || 'Profesional pero cercano',
                primaryTone: tone || null,
                brandPersonality: personality || [],
                guardrails: guardrails || [],
                forbiddenWords: forbiddenWords || [],
                requiredHashtags: requiredHashtags || [],
                voiceDescription: samplePhrases?.join('\n') || null,
                valueProposition: valueProposition || null,
            },
            create: {
                clientId: params.id,
                tone: tone || 'Profesional pero cercano',
                primaryTone: tone || null,
                brandPersonality: personality || [],
                guardrails: guardrails || [],
                forbiddenWords: forbiddenWords || [],
                requiredHashtags: requiredHashtags || [],
                voiceDescription: samplePhrases?.join('\n') || null,
                valueProposition: valueProposition || null,
            },
        })

        return NextResponse.json(updatedBrandKit)
    } catch (error) {
        console.error('Error updating brand kit:', error)
        return NextResponse.json({ error: 'Error al actualizar brand kit' }, { status: 500 })
    }
}
