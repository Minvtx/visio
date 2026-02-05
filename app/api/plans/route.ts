import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Default plans configuration
const DEFAULT_PLANS = [
    {
        id: 'plan-base',
        name: 'Base',
        postsPerMonth: 8,
        carouselsPerMonth: 2,
        reelsPerMonth: 2,
        storiesPerMonth: 4,
    },
    {
        id: 'plan-growth',
        name: 'Growth',
        postsPerMonth: 12,
        carouselsPerMonth: 4,
        reelsPerMonth: 4,
        storiesPerMonth: 8,
    },
    {
        id: 'plan-pro',
        name: 'Pro',
        postsPerMonth: 20,
        carouselsPerMonth: 8,
        reelsPerMonth: 8,
        storiesPerMonth: 12,
    },
]

// GET /api/plans - List all plans
export async function GET() {
    try {
        let plans = await prisma.plan.findMany({
            orderBy: { postsPerMonth: 'asc' },
        })

        // If no plans exist, create the default ones
        if (plans.length === 0) {
            await prisma.plan.createMany({
                data: DEFAULT_PLANS,
            })
            plans = await prisma.plan.findMany({
                orderBy: { postsPerMonth: 'asc' },
            })
        }

        // Add calculated totals
        const plansWithTotals = plans.map(plan => ({
            ...plan,
            totalPieces: plan.postsPerMonth + plan.carouselsPerMonth + plan.reelsPerMonth + plan.storiesPerMonth,
        }))

        return NextResponse.json(plansWithTotals)
    } catch (error) {
        console.error('Error listing plans:', error)
        return NextResponse.json({ error: 'Error al listar planes' }, { status: 500 })
    }
}

// POST /api/plans - Create a custom plan (admin only)
export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const body = await request.json()
        const { name, postsPerMonth, carouselsPerMonth, reelsPerMonth, storiesPerMonth } = body

        if (!name) {
            return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 })
        }

        const plan = await prisma.plan.create({
            data: {
                name,
                postsPerMonth: postsPerMonth || 12,
                carouselsPerMonth: carouselsPerMonth || 4,
                reelsPerMonth: reelsPerMonth || 4,
                storiesPerMonth: storiesPerMonth || 8,
            },
        })

        return NextResponse.json(plan, { status: 201 })
    } catch (error) {
        console.error('Error creating plan:', error)
        return NextResponse.json({ error: 'Error al crear plan' }, { status: 500 })
    }
}
