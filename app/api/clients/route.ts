import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { canCreateClient } from '@/lib/workspace'

// Schema for client creation
const createClientSchema = z.object({
    name: z.string().min(2, 'Nombre muy corto'),
    slug: z.string().min(2).regex(/^[a-z0-9-]+$/, 'Solo letras minúsculas, números y guiones'),
    industry: z.string().optional(),
    description: z.string().optional(),
    country: z.string().optional(),
    city: z.string().optional(),
    dialect: z.string().optional(),
})

// GET /api/clients - List all clients for the workspace
export async function GET() {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        // Only admins can list all clients
        if (session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
        }

        const clients = await prisma.client.findMany({
            where: {
                workspaceId: session.user.workspaceId!,
            },
            include: {
                _count: {
                    select: {
                        contentMonths: true,
                        users: true,
                    },
                },
                contentMonths: {
                    orderBy: [{ year: 'desc' }, { month: 'desc' }],
                    take: 1,
                    include: {
                        _count: {
                            select: { pieces: true },
                        },
                    },
                },
                plan: {
                    select: {
                        name: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        })

        return NextResponse.json(clients)
    } catch (error) {
        console.error('Error listing clients:', error)
        return NextResponse.json({ error: 'Error al listar clientes' }, { status: 500 })
    }
}

// POST /api/clients - Create a new client
export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        if (session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
        }

        // FREEMIUM LIMIT CHECK
        const limitCheck = await canCreateClient(session.user.workspaceId!)
        if (!limitCheck.allowed) {
            return NextResponse.json(
                {
                    error: `Has alcanzado el límite de ${limitCheck.max} clientes en tu plan. Upgrade para agregar más.`,
                    code: 'LIMIT_REACHED',
                    current: limitCheck.current,
                    max: limitCheck.max
                },
                { status: 403 }
            )
        }

        const body = await request.json()
        const validation = createClientSchema.safeParse(body)

        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error.errors[0].message },
                { status: 400 }
            )
        }

        const { name, slug, industry, description, country, city, dialect } = validation.data

        // Check if slug already exists in workspace
        const existingClient = await prisma.client.findFirst({
            where: {
                workspaceId: session.user.workspaceId!,
                slug,
            },
        })

        if (existingClient) {
            return NextResponse.json(
                { error: 'Ya existe un cliente con ese slug' },
                { status: 400 }
            )
        }

        // Create client with BrandKit and KnowledgeBase
        const client = await prisma.client.create({
            data: {
                workspaceId: session.user.workspaceId!,
                name,
                slug,
                industry,
                description,
                country,
                city,
                dialect,
                brandKit: {
                    create: {
                        tone: 'Profesional pero cercano',
                        guardrails: [],
                        forbiddenWords: [],
                        requiredHashtags: [],
                    },
                },
                knowledgeBase: {
                    create: {
                        about: '',
                        competitors: [],
                    },
                },
            },
            include: {
                brandKit: true,
                knowledgeBase: true,
            },
        })

        return NextResponse.json(client, { status: 201 })
    } catch (error) {
        console.error('Error creating client:', error)
        return NextResponse.json({ error: 'Error al crear cliente' }, { status: 500 })
    }
}
