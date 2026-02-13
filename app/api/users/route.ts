import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, hashPassword } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Schema for user creation
const createUserSchema = z.object({
    email: z.string().email('Email inválido'),
    name: z.string().min(2, 'Nombre muy corto'),
    password: z.string().min(8, 'Contraseña debe tener al menos 8 caracteres').optional().or(z.literal('')),
    role: z.enum(['ADMIN', 'MANAGER', 'CREATOR', 'REVIEWER', 'CLIENT']),
    clientId: z.string().optional(), // Required if role is CLIENT
})

// GET /api/users - List all users (admin only)
export async function GET() {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const users = await prisma.user.findMany({
            where: {
                workspaceId: session.user.workspaceId!,
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                clientId: true,
                client: {
                    select: {
                        name: true,
                    },
                },
                createdAt: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        })

        return NextResponse.json(users)
    } catch (error) {
        console.error('Error listing users:', error)
        return NextResponse.json({ error: 'Error al listar usuarios' }, { status: 500 })
    }
}

// POST /api/users - Create a new user (admin only)
export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const body = await request.json()
        const validation = createUserSchema.safeParse(body)

        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error.errors[0].message },
                { status: 400 }
            )
        }

        const { email, name, password, role, clientId } = validation.data

        // Check if email already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        })

        if (existingUser) {
            return NextResponse.json(
                { error: 'Ya existe un usuario con ese email' },
                { status: 400 }
            )
        }

        // If role is CLIENT, clientId is required
        if (role === 'CLIENT' && !clientId) {
            return NextResponse.json(
                { error: 'Debes seleccionar un cliente para usuarios tipo CLIENT' },
                { status: 400 }
            )
        }

        // Create user
        const hashedPassword = password ? await hashPassword(password) : null

        const user = await prisma.user.create({
            data: {
                email,
                name,
                password: hashedPassword,
                role,
                workspaceId: session.user.workspaceId,
                clientId: role === 'CLIENT' ? clientId : null,
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                clientId: true,
                createdAt: true,
            },
        })

        return NextResponse.json(user, { status: 201 })
    } catch (error) {
        console.error('Error creating user:', error)
        return NextResponse.json({ error: 'Error al crear usuario' }, { status: 500 })
    }
}
