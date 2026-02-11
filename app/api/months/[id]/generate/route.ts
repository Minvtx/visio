import { NextRequest, NextResponse } from 'next/server'
export const maxDuration = 60;
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createJob } from '@/lib/queue/mock-queue'
import { getWorkspaceApiKeys } from '@/lib/workspace'

// POST /api/months/[id]/generate - Generate content for a month (now async via Job)
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        // Verify API key exists (platform key or user key depending on tier)
        const apiKeys = await getWorkspaceApiKeys(session.user.workspaceId!)
        if (!apiKeys.anthropic) {
            return NextResponse.json(
                {
                    error: 'No hay API Key configurada. Contacta al administrador.',
                    code: 'NO_API_KEY'
                },
                { status: 500 } // 500 because this is a server config issue, not user error
            )
        }

        // Get the content month
        const contentMonth = await prisma.contentMonth.findUnique({
            where: { id: params.id },
            include: {
                pieces: true
            }
        })

        if (!contentMonth) {
            return NextResponse.json({ error: 'Mes no encontrado' }, { status: 404 })
        }

        // Parse optional body for configuration
        let usePipeline = true
        let fallbackToMonolithic = true
        try {
            const body = await request.json()
            if (body.mode === 'monolithic') {
                usePipeline = false
            }
        } catch {
            // No body or invalid JSON, use defaults
        }

        // Create Job
        const job = await createJob(
            'GENERATE_PIECES',
            {
                monthId: params.id,
                usePipeline,
                fallbackToMonolithic
            },
            params.id,
            'ContentMonth',
            session.user.id,
            true // waitForCompletion: true for Vercel
        );

        // Update status to GENERATING immediately so UI reflects it
        await prisma.contentMonth.update({
            where: { id: params.id },
            data: { status: 'GENERATING' }
        });

        return NextResponse.json({
            success: true,
            jobId: job.id,
            message: 'Generación iniciada en segundo plano'
        })

    } catch (error) {
        console.error('Error starting generation job:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Error al iniciar generación' },
            { status: 500 }
        )
    }
}
