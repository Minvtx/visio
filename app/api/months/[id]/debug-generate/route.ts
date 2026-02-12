import { NextRequest, NextResponse } from 'next/server'
export const maxDuration = 300;

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateStrategy, generateSinglePiece } from '@/lib/agents/piece-generator'
import { getWorkspaceApiKeys } from '@/lib/workspace'

/**
 * GET /api/months/[id]/debug-generate
 * 
 * Diagnostic endpoint. Runs the FULL generation pipeline for a month
 * and returns detailed logs of every step, including errors.
 * This helps identify exactly where the process fails.
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const logs: string[] = []
    const log = (msg: string) => {
        console.log(`[DEBUG-GEN] ${msg}`)
        logs.push(`${new Date().toISOString()} | ${msg}`)
    }

    try {
        log('=== STARTING DEBUG GENERATION ===')
        log(`Month ID: ${params.id}`)

        // 1. Session check
        const session = await getServerSession(authOptions)
        log(`Session: ${session ? 'OK' : 'NO SESSION'}, User: ${session?.user?.email || 'none'}, Role: ${(session?.user as any)?.role || 'none'}`)

        if (!session?.user) {
            return NextResponse.json({ success: false, error: 'No session', logs })
        }

        // 2. Load month data
        log('Loading month data...')
        const month = await prisma.contentMonth.findUnique({
            where: { id: params.id },
            include: {
                client: {
                    include: { brandKit: true, knowledgeBase: true, plan: true }
                }
            }
        })

        if (!month) {
            log('ERROR: Month not found')
            return NextResponse.json({ success: false, error: 'Month not found', logs })
        }

        log(`Month: ${month.month}/${month.year}, Status: ${month.status}`)
        log(`Client: ${month.client?.name || 'NO CLIENT'}`)
        log(`WorkspaceId: ${month.client?.workspaceId || 'none'}`)
        log(`BrandKit: ${month.client?.brandKit ? 'YES' : 'NO'}`)
        log(`KnowledgeBase: ${month.client?.knowledgeBase ? 'YES' : 'NO'}`)
        log(`Plan: ${month.client?.plan ? 'YES (' + month.client.plan.name + ')' : 'NO'}`)

        // 3. Build context
        const { client } = month
        const brandContext = {
            name: client.name,
            industry: client.industry || '',
            about: client.brandKit?.missionStatement || client.description || '',
            primaryTone: client.brandKit?.primaryTone || client.brandKit?.tone || 'Profesional',
            brandPersonality: client.brandKit?.brandPersonality || [],
            products: client.knowledgeBase?.products || [],
            targetAudiences: client.knowledgeBase?.targetAudiences || [],
            requiredHashtags: client.brandKit?.requiredHashtags || [],
            forbiddenWords: client.brandKit?.forbiddenWords || [],
            guardrails: client.brandKit?.guardrails || []
        }
        const monthBrief = {
            month: month.month,
            year: month.year,
            primaryObjective: month.primaryObjective || 'Engagement',
            additionalContext: month.specificGoal || '',
            activeCampaigns: month.activeCampaigns || []
        }
        log(`Brand context built OK: ${JSON.stringify(brandContext).substring(0, 200)}...`)

        // 4. Check API Key
        const envKey = process.env.ANTHROPIC_API_KEY
        const maskedEnv = envKey ? `${envKey.substring(0, 10)}...${envKey.substring(envKey.length - 4)}` : 'MISSING'
        log(`Platform Key (.env): ${maskedEnv} (len: ${envKey?.length || 0})`)

        log(`Checking workspace ${client.workspaceId} for custom keys...`)
        const workspaceKeys = await getWorkspaceApiKeys(client.workspaceId)
        const maskedWs = workspaceKeys?.anthropic
            ? `${workspaceKeys.anthropic.substring(0, 10)}...${workspaceKeys.anthropic.substring(workspaceKeys.anthropic.length - 4)}`
            : 'NONE'
        log(`Workspace Key (DB): ${maskedWs}`)

        // 5. Test Strategy Generation
        log('--- Testing Strategy Generation ---')
        const plan = { posts: 2, carousels: 1, reels: 1, stories: 0 } // Small test

        let strategy: any
        try {
            log('Calling generateStrategy (Sonnet)...')
            strategy = await generateStrategy(brandContext as any, monthBrief as any, plan, client.workspaceId)
            log(`Strategy SUCCESS. Objective: ${strategy.monthlyObjective}`)
        } catch (e: any) {
            log(`Strategy FAILED: ${e.message}`)
            log(`Full Error: ${JSON.stringify(e)}`)
            return NextResponse.json({ success: false, error: `Strategy failed: ${e.message}`, logs })
        }

        // 6. Test 2-Step Generation (New Logic)
        log('--- Testing 2-Step Generation (Concept -> Details) ---')
        let piece: any
        try {
            // Step A: Concept
            log('Step A: Generating Concept (Sonnet 2-step)...')
            // Import dynamically or assume imported
            const { generatePieceConcept, generatePieceDetails } = require('@/lib/agents/piece-generator');

            const concept = await generatePieceConcept({
                brand: brandContext as any,
                brief: monthBrief,
                format: 'POST',
                pillar: 'Educación',
                dayOfMonth: 1,
                pieceNumber: 1,
                totalPieces: 1,
            }, client.workspaceId);
            log(`Concept OK: ${concept.topic}`)

            // Step B: Details
            log('Step B: Generating Details...')
            piece = await generatePieceDetails(concept, {
                brand: brandContext as any,
                brief: monthBrief,
                format: 'POST',
                pillar: 'Educación',
                dayOfMonth: 1,
                pieceNumber: 1,
                totalPieces: 1,
            }, client.workspaceId);
            log(`Details OK. Copy length: ${piece.captionLong?.length}`)

        } catch (e: any) {
            log(`Generation FAILED: ${e.message}`)
            log(`Full Error: ${JSON.stringify(e)}`)
            return NextResponse.json({ success: false, error: `Generation failed: ${e.message}`, logs })
        }

        // 7. Test DB Save
        log('--- Testing DB Save ---')
        try {
            const saved = await prisma.contentPiece.create({
                data: {
                    contentMonthId: params.id,
                    type: piece.format as any,
                    title: piece.topic || 'Test Piece',
                    pillar: piece.pillar || 'Test',
                    copy: JSON.stringify({
                        hooks: piece.hooks || [],
                        captionLong: piece.captionLong || '',
                        captionShort: piece.captionShort || '',
                        ctas: piece.ctas || [],
                    }),
                    hashtags: piece.hashtags || [],
                    visualBrief: piece.visualBrief || '',
                    suggestedDate: new Date(month.year, month.month - 1, 1),
                    status: 'DRAFT',
                    order: 0,
                    metadata: {
                        carouselSlides: piece.carouselSlides || null,
                        debug: true,
                    }
                }
            })
            log(`DB Save SUCCESS! Piece ID: ${saved.id}`)
        } catch (e: any) {
            log(`DB Save FAILED: ${e.message}`)
            log(`Full DB error: ${e.toString()}`)
            return NextResponse.json({ success: false, error: `DB save failed: ${e.message}`, logs })
        }

        // 8. Verify piece exists
        log('--- Verifying piece in DB ---')
        const count = await prisma.contentPiece.count({
            where: { contentMonthId: params.id }
        })
        log(`Total pieces in DB for this month: ${count}`)

        log('=== DEBUG GENERATION COMPLETE - ALL STEPS PASSED ===')
        return NextResponse.json({ success: true, piecesInDb: count, logs })

    } catch (e: any) {
        log(`UNEXPECTED ERROR: ${e.message}`)
        return NextResponse.json({ success: false, error: e.message, logs }, { status: 500 })
    }
}
