import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'

// POST /api/auth/setup - Create initial admin user
export async function POST(request: Request) {
    try {
        // Check if any admin exists
        const adminExists = await prisma.user.findFirst({
            where: { role: 'ADMIN' },
        })

        if (adminExists) {
            return NextResponse.json(
                { error: 'Ya existe un administrador. Usa /login para acceder.' },
                { status: 400 }
            )
        }

        const body = await request.json()
        const { email, password, name } = body

        if (!email || !password || !name) {
            return NextResponse.json(
                { error: 'Email, contraseña y nombre son requeridos' },
                { status: 400 }
            )
        }

        // Create default workspace
        const workspace = await prisma.workspace.create({
            data: {
                name: 'Mi Agencia',
                slug: 'mi-agencia',
            },
        })

        // Create admin user
        const hashedPassword = await hashPassword(password)
        const normalizedEmail = email.toLowerCase()
        const user = await prisma.user.create({
            data: {
                email: normalizedEmail,
                password: hashedPassword,
                name,
                role: 'ADMIN',
                workspaceId: workspace.id,
            },
        })

        return NextResponse.json({
            success: true,
            message: 'Administrador creado exitosamente',
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
            },
        })
    } catch (error) {
        console.error('Setup error:', error)
        return NextResponse.json(
            { error: 'Error al crear el administrador' },
            { status: 500 }
        )
    }
}

// GET /api/auth/setup - Check if setup is needed
export async function GET() {
    try {
        const adminExists = await prisma.user.findFirst({
            where: { role: 'ADMIN' },
        })

        return NextResponse.json({
            setupRequired: !adminExists,
        })
    } catch (error) {
        return NextResponse.json(
            { error: 'Error al verificar configuración' },
            { status: 500 }
        )
    }
}
