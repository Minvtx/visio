import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getWorkspaceConfig, canCreateClient, getWorkspaceApiKeys, TIER_LIMITS } from '@/lib/workspace'

// GET /api/workspace/status - Get workspace limits and status
export async function GET() {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const workspaceId = session.user.workspaceId!

        // Get all status info
        const [config, clientLimit, apiKeys] = await Promise.all([
            getWorkspaceConfig(workspaceId),
            canCreateClient(workspaceId),
            getWorkspaceApiKeys(workspaceId)
        ])

        const tierInfo = TIER_LIMITS[config.tier as keyof typeof TIER_LIMITS]

        return NextResponse.json({
            tier: config.tier,
            tierName: tierInfo.name,
            clients: {
                current: clientLimit.current,
                max: clientLimit.max,
                canCreate: clientLimit.allowed
            },
            apiKeys: {
                hasAnthropic: !!apiKeys.anthropic,
                hasOpenAI: !!apiKeys.openai,
                canGenerate: !!apiKeys.anthropic // Need at least Anthropic to generate
            },
            features: {
                byokRequired: config.tier === 'FREE', // Free users must use BYOK
                unlimitedClients: config.tier === 'AGENCY' && tierInfo.maxClients === 999
            }
        })
    } catch (error) {
        console.error('Error getting workspace status:', error)
        return NextResponse.json({ error: 'Error al obtener estado' }, { status: 500 })
    }
}
