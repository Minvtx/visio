import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { skillRegistry } from '@/lib/skills/registry'
import { prisma } from '@/lib/prisma'

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const skillId = params.id
        const body = await request.json()

        const skill = skillRegistry.get(skillId)
        if (!skill) {
            return NextResponse.json(
                { error: `Skill not found: ${skillId}` },
                { status: 404 }
            )
        }

        // Invoke the skill
        const result = await skillRegistry.invoke(skillId, body.input || body)

        if (!result.success) {
            return NextResponse.json(
                { error: result.error },
                { status: 500 }
            )
        }

        // Log the generation run to database
        if (body.pieceId) {
            try {
                await prisma.generationRun.create({
                    data: {
                        skillId,
                        input: body.input || body,
                        output: result.output as any,
                        tokensUsed: result.tokensUsed,
                        contentPieceId: body.pieceId,
                    }
                })
            } catch (dbError) {
                console.error('Failed to log generation run:', dbError)
                // Don't fail the request if logging fails
            }
        }

        return NextResponse.json({
            success: true,
            output: result.output,
            tokensUsed: result.tokensUsed,
            duration: result.duration,
        })
    } catch (error) {
        console.error('Skill invocation error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

