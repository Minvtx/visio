import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: Request) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) { // Using email as proxy for auth since we might not have user.id in session yet
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user to find workspace
    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { workspaceId: true }
    })

    if (!user?.workspaceId) {
        return NextResponse.json({ error: 'No workspace found' }, { status: 400 })
    }

    try {
        // Fetch System Plans (workspaceId is null) AND Custom Plans (workspaceId matches)
        const plans = await prisma.plan.findMany({
            where: {
                OR: [
                    { workspaceId: null },
                    { workspaceId: user.workspaceId }
                ]
            },
            orderBy: {
                createdAt: 'asc'
            }
        })

        return NextResponse.json(plans)
    } catch (error) {
        console.error('Error fetching plans:', error)
        return NextResponse.json({ error: 'Error fetching plans' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { workspaceId: true }
    })

    if (!user?.workspaceId) {
        return NextResponse.json({ error: 'No workspace found' }, { status: 400 })
    }

    try {
        const body = await request.json()
        const { name, postsPerMonth, carouselsPerMonth, reelsPerMonth, storiesPerMonth } = body

        if (!name) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 })
        }

        const plan = await prisma.plan.create({
            data: {
                name,
                postsPerMonth: Number(postsPerMonth) || 0,
                carouselsPerMonth: Number(carouselsPerMonth) || 0,
                reelsPerMonth: Number(reelsPerMonth) || 0,
                storiesPerMonth: Number(storiesPerMonth) || 0,
                workspaceId: user.workspaceId
            }
        })

        return NextResponse.json(plan)
    } catch (error) {
        console.error('Error creating plan:', error)
        return NextResponse.json({ error: 'Error creating plan' }, { status: 500 })
    }
}

export async function DELETE(request: Request) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { workspaceId: true }
    })

    try {
        // Verify ownership
        const plan = await prisma.plan.findUnique({ where: { id } })

        if (!plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 })

        // Only allow deleting custom plans belonging to this workspace
        if (plan.workspaceId !== user?.workspaceId) {
            return NextResponse.json({ error: 'Cannot delete this plan' }, { status: 403 })
        }

        await prisma.plan.delete({ where: { id } })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting plan:', error)
        return NextResponse.json({ error: 'Error deleting plan' }, { status: 500 })
    }
}
