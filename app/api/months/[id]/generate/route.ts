import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getWorkspaceApiKeys } from '@/lib/workspace'
import { inngest } from '@/lib/inngest/client'

// POST /api/months/[id]/generate - Trigger content generation via Inngest
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        // Verify API key exists
        const apiKeys = await getWorkspaceApiKeys(session.user.workspaceId!)
        if (!apiKeys.anthropic) {
            return NextResponse.json(
                {
                    error: 'No hay API Key configurada. Ve a Settings para agregarla.',
                    code: 'NO_API_KEY'
                },
                { status: 400 }
            )
        }

        // Get the content month
        const contentMonth = await prisma.contentMonth.findUnique({
            where: { id: params.id },
        })

        if (!contentMonth) {
            return NextResponse.json({ error: 'Mes no encontrado' }, { status: 404 })
        }

        // Mark as generating immediately
        await prisma.contentMonth.update({
            where: { id: params.id },
            data: { status: 'GENERATING' }
        })

        // Send event to Inngest (returns immediately, <1 second)
        await inngest.send({
            name: "content/month.generate",
            data: {
                monthId: params.id,
                userId: session.user.id,
            },
        });

        return NextResponse.json({
            success: true,
            message: 'Generación iniciada en segundo plano',
            status: 'GENERATING'
        })

    } catch (error) {
        console.error('Error starting generation:', error)

        // If sending to inngest fails, reset the month status
        try {
            await prisma.contentMonth.update({
                where: { id: params.id },
                data: { status: 'DRAFT' }
            })
        } catch { }

        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Error al iniciar generación' },
            { status: 500 }
        )
    }
}
