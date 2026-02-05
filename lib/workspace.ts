import { prisma } from './prisma'

export interface WorkspaceApiKeys {
    anthropic?: string
    openai?: string
}

export interface WorkspaceConfig {
    tier: 'FREE' | 'PRO' | 'AGENCY'
    maxClients: number
    apiKeys: WorkspaceApiKeys
}

/**
 * Get API keys for a workspace
 * FREE tier: uses platform API key (env vars) - no config needed
 * PRO/AGENCY: can use their own keys (BYOK) or fallback to platform
 */
export async function getWorkspaceApiKeys(workspaceId: string): Promise<WorkspaceApiKeys> {
    if (!workspaceId) {
        // Fallback to env vars if no workspace
        return {
            anthropic: process.env.ANTHROPIC_API_KEY,
            openai: process.env.OPENAI_API_KEY,
        }
    }

    const workspace = await prisma.workspace.findUnique({
        where: { id: workspaceId },
        select: { settings: true },
    })

    const settings = (workspace?.settings as Record<string, unknown>) || {}
    const tier = (settings.tier as string) || 'FREE'
    const apiKeys = (settings.apiKeys as WorkspaceApiKeys) || {}

    // FREE tier always uses platform keys (no BYOK required)
    if (tier === 'FREE') {
        return {
            anthropic: process.env.ANTHROPIC_API_KEY,
            openai: process.env.OPENAI_API_KEY,
        }
    }

    // PRO/AGENCY: user's key takes priority, fallback to env var
    return {
        anthropic: apiKeys.anthropic || process.env.ANTHROPIC_API_KEY,
        openai: apiKeys.openai || process.env.OPENAI_API_KEY,
    }
}

/**
 * Get the full workspace configuration
 */
export async function getWorkspaceConfig(workspaceId: string): Promise<WorkspaceConfig> {
    const workspace = await prisma.workspace.findUnique({
        where: { id: workspaceId },
        select: { settings: true },
    })

    const settings = (workspace?.settings as Record<string, unknown>) || {}

    return {
        tier: (settings.tier as 'FREE' | 'PRO' | 'AGENCY') || 'FREE',
        maxClients: (settings.maxClients as number) || 2,
        apiKeys: (settings.apiKeys as WorkspaceApiKeys) || {},
    }
}

/**
 * Check if workspace can create more clients based on their tier
 */
export async function canCreateClient(workspaceId: string): Promise<{ allowed: boolean; current: number; max: number }> {
    const config = await getWorkspaceConfig(workspaceId)

    const clientCount = await prisma.client.count({
        where: { workspaceId },
    })

    return {
        allowed: clientCount < config.maxClients,
        current: clientCount,
        max: config.maxClients,
    }
}

/**
 * Get tier limits
 * Credits = tokens permitidos. 100k tokens ≈ $1.50 USD (Anthropic)
 */
export const TIER_LIMITS = {
    FREE: { name: 'Free', maxClients: 2, credits: 100000, price: 0 },
    PRO: { name: 'Pro', maxClients: 5, credits: 500000, price: 49 },
    AGENCY: { name: 'Agency', maxClients: 999, credits: -1, price: 99 }, // -1 = unlimited
}
