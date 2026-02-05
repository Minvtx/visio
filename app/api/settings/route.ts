import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/settings - Get workspace settings
export async function GET() {
    const session = await getServerSession(authOptions)

    if (!session?.user?.workspaceId) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const workspace = await prisma.workspace.findUnique({
        where: { id: session.user.workspaceId },
        select: {
            id: true,
            name: true,
            slug: true,
            settings: true,
        },
    })

    if (!workspace) {
        return NextResponse.json({ error: 'Workspace no encontrado' }, { status: 404 })
    }

    // Parse settings and mask API keys for security
    const settings = (workspace.settings as Record<string, unknown>) || {}
    const apiKeys = (settings.apiKeys as Record<string, string>) || {}

    const maskedApiKeys: Record<string, string> = {}
    for (const [provider, key] of Object.entries(apiKeys)) {
        if (key && typeof key === 'string') {
            // Show only last 4 characters
            maskedApiKeys[provider] = key.length > 8
                ? '••••••••' + key.slice(-4)
                : '••••••••'
        }
    }

    return NextResponse.json({
        workspace: {
            id: workspace.id,
            name: workspace.name,
            slug: workspace.slug,
        },
        settings: {
            tier: settings.tier || 'FREE',
            maxClients: settings.maxClients || 2,
            apiKeys: maskedApiKeys,
            hasAnthropicKey: !!apiKeys.anthropic,
            hasOpenAIKey: !!apiKeys.openai,
        },
    })
}

// PATCH /api/settings - Update workspace settings
export async function PATCH(request: NextRequest) {
    const session = await getServerSession(authOptions)

    if (!session?.user?.workspaceId) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { name, apiKeys } = body

    // Get current settings
    const workspace = await prisma.workspace.findUnique({
        where: { id: session.user.workspaceId },
    })

    if (!workspace) {
        return NextResponse.json({ error: 'Workspace no encontrado' }, { status: 404 })
    }

    const currentSettings = (workspace.settings as Record<string, unknown>) || {}
    const currentApiKeys = (currentSettings.apiKeys as Record<string, string>) || {}

    // Update settings
    const updatedSettings = {
        ...currentSettings,
        ...(name && { name }),
    }

    // Update API keys if provided
    if (apiKeys) {
        const newApiKeys = { ...currentApiKeys }

        // Only update keys that are provided and not masked
        if (apiKeys.anthropic && !apiKeys.anthropic.includes('••••')) {
            newApiKeys.anthropic = apiKeys.anthropic
        }
        if (apiKeys.openai && !apiKeys.openai.includes('••••')) {
            newApiKeys.openai = apiKeys.openai
        }

        updatedSettings.apiKeys = newApiKeys
    }

    // Update workspace
    const updatedWorkspace = await prisma.workspace.update({
        where: { id: session.user.workspaceId },
        data: {
            ...(name && { name }),
            settings: updatedSettings,
        },
    })

    return NextResponse.json({
        success: true,
        workspace: {
            id: updatedWorkspace.id,
            name: updatedWorkspace.name,
        },
    })
}

// DELETE /api/settings/api-key - Remove an API key
export async function DELETE(request: NextRequest) {
    const session = await getServerSession(authOptions)

    if (!session?.user?.workspaceId) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const provider = searchParams.get('provider')

    if (!provider || !['anthropic', 'openai'].includes(provider)) {
        return NextResponse.json({ error: 'Provider inválido' }, { status: 400 })
    }

    const workspace = await prisma.workspace.findUnique({
        where: { id: session.user.workspaceId },
    })

    if (!workspace) {
        return NextResponse.json({ error: 'Workspace no encontrado' }, { status: 404 })
    }

    const currentSettings = (workspace.settings as Record<string, unknown>) || {}
    const currentApiKeys = (currentSettings.apiKeys as Record<string, string>) || {}

    // Remove the key
    delete currentApiKeys[provider]

    await prisma.workspace.update({
        where: { id: session.user.workspaceId },
        data: {
            settings: {
                ...currentSettings,
                apiKeys: currentApiKeys,
            },
        },
    })

    return NextResponse.json({ success: true })
}
