import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { pipelineOrchestrator } from '@/lib/skills/orchestrator'

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const pipelineId = params.id
        const body = await request.json()

        const pipeline = pipelineOrchestrator.get(pipelineId)
        if (!pipeline) {
            return NextResponse.json(
                { error: `Pipeline not found: ${pipelineId}` },
                { status: 404 }
            )
        }

        // Execute the pipeline with provided context
        const result = await pipelineOrchestrator.execute(pipelineId, body.context || body)

        return NextResponse.json({
            success: result.success,
            context: result.context,
            logs: result.logs,
            totalTokens: result.totalTokens,
            totalDuration: result.totalDuration,
            error: result.error,
        })
    } catch (error) {
        console.error('Pipeline execution error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

// GET - List available pipelines
export async function GET() {
    try {
        const pipelines = pipelineOrchestrator.list().map(p => ({
            id: p.id,
            name: p.name,
            description: p.description,
            stepCount: p.steps.length,
        }))

        return NextResponse.json(pipelines)
    } catch (error) {
        console.error('Error listing pipelines:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
