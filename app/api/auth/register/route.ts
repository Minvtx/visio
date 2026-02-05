import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'
import { z } from 'zod'

const registerSchema = z.object({
    name: z.string().min(2, 'Nombre debe tener al menos 2 caracteres'),
    email: z.string().email('Email inválido'),
    password: z.string().min(6, 'Contraseña debe tener al menos 6 caracteres'),
    agencyName: z.string().optional(),
})

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const validation = registerSchema.safeParse(body)

        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error.errors[0].message },
                { status: 400 }
            )
        }

        const { name, email, password, agencyName } = validation.data

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        })

        if (existingUser) {
            return NextResponse.json(
                { error: 'Ya existe una cuenta con este email' },
                { status: 400 }
            )
        }

        // Hash password
        const hashedPassword = await hashPassword(password)

        // Create workspace for the new user
        const workspaceSlug = (agencyName || name)
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '')
            + '-' + Date.now().toString(36)

        const workspace = await prisma.workspace.create({
            data: {
                name: agencyName || `${name}'s Agency`,
                slug: workspaceSlug,
                settings: {
                    tier: 'FREE',
                    maxClients: 2,
                    apiKeys: {},
                },
            },
        })

        // Create user as ADMIN of their workspace
        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: 'ADMIN',
                workspaceId: workspace.id,
            },
        })

        return NextResponse.json({
            success: true,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
            },
        })
    } catch (error) {
        console.error('Registration error:', error)
        return NextResponse.json(
            { error: 'Error al crear la cuenta' },
            { status: 500 }
        )
    }
}
