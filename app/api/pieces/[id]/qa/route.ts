import { NextResponse } from 'next/server'
export const maxDuration = 60; // Vercel Pro
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { runQualityCheck } from '@/lib/skills/qa-auditor'
import { logActivity } from '@/lib/audit'

// POST /api/pieces/[id]/qa - Run Check
export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        // Get piece and brand kit
        const piece = await prisma.contentPiece.findUnique({
            where: { id: params.id },
            include: {
                contentMonth: {
                    include: {
                        client: {
                            include: { brandKit: true }
                        }
                    }
                }
            }
        })

        if (!piece) {
            return NextResponse.json({ error: 'Pieza no encontrada' }, { status: 404 })
        }

        const brandKit = piece.contentMonth.client.brandKit

        // Extract content text
        let contentText = ''
        if (typeof piece.copy === 'string') {
            const parsed = JSON.parse(piece.copy)
            contentText = parsed.captionLong || ''
        } else if (typeof piece.copy === 'object' && piece.copy !== null) {
            contentText = (piece.copy as any).captionLong || ''
        }

        // Run QA Logic
        let qaResult
        try {
            // First run basic regex check
            const basicCheck = await runQualityCheck({
                content: contentText,
                hashtags: piece.hashtags,
                forbiddenWords: brandKit?.forbiddenWords || [],
                forbiddenHashtags: brandKit?.forbiddenHashtags || [],
                requiredHashtags: brandKit?.requiredHashtags || [],
                tone: brandKit?.primaryTone || 'neutral'
            })

            // Then run advanced LLM Brand Enforcer
            const { invokeSkill } = await import('@/lib/skills')
            const advancedCheck = await invokeSkill('brand-guidelines', {
                content: contentText,
                brandKit: {
                    tone: brandKit?.primaryTone || 'Professional',
                    brandPersonality: brandKit?.brandPersonality || [],
                    values: [], // BrandValues not present in schema yet
                    forbiddenWords: brandKit?.forbiddenWords || []
                }
            })

            if (advancedCheck.success && advancedCheck.output) {
                const output = advancedCheck.output as any
                // Merge results: Use LLM score but respect basic violations
                qaResult = {
                    score: output.score,
                    passed: output.compliant && basicCheck.passed,
                    violations: [...basicCheck.violations, ...(output.violations || [])],
                    suggestions: [...basicCheck.suggestions, ...(output.suggestions || [])]
                }
            } else {
                // Fallback to basic
                qaResult = basicCheck
            }

        } catch (err) {
            console.error('Advanced QA Failed, using basic', err)
            // Fallback to basic
            qaResult = await runQualityCheck({
                content: contentText,
                hashtags: piece.hashtags,
                forbiddenWords: brandKit?.forbiddenWords || [],
                forbiddenHashtags: brandKit?.forbiddenHashtags || [],
                requiredHashtags: brandKit?.requiredHashtags || [],
                tone: brandKit?.primaryTone || 'neutral'
            })
        }

        // Save result
        const savedCheck = await prisma.qualityCheck.create({
            data: {
                pieceId: piece.id,
                versionId: piece.currentVersionId,
                score: qaResult.score,
                passed: qaResult.passed,
                violations: qaResult.violations,
                suggestions: qaResult.suggestions
            }
        })

        await logActivity(session.user.id, 'RUN_QA', piece.id, 'ContentPiece', { score: qaResult.score, passed: qaResult.passed })

        return NextResponse.json(savedCheck)
    } catch (error) {
        console.error('Error running QA:', error)
        return NextResponse.json({ error: 'Error al ejecutar QA' }, { status: 500 })
    }
}

// GET /api/pieces/[id]/qa - Get Latest Checks
export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const checks = await prisma.qualityCheck.findMany({
            where: { pieceId: params.id },
            orderBy: { runAt: 'desc' },
            take: 5
        })

        return NextResponse.json(checks)
    } catch (error) {
        return NextResponse.json({ error: 'Error al obtener QA' }, { status: 500 })
    }
}
