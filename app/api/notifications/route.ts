import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/notifications - List user's notifications
export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const notifications = await prisma.notification.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: 'desc' },
            take: 20
        })

        return NextResponse.json(notifications)
    } catch (e) {
        return NextResponse.json({ error: 'Error' }, { status: 500 })
    }
}

// PATCH /api/notifications - Mark as read (all or specific)
export async function PATCH(request: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const body = await request.json()
        const { id } = body // if provided, mark one. Else mark all.

        if (id) {
            await prisma.notification.update({
                where: { id, userId: session.user.id },
                data: { read: true }
            })
        } else {
            await prisma.notification.updateMany({
                where: { userId: session.user.id, read: false },
                data: { read: true }
            })
        }

        return NextResponse.json({ success: true })
    } catch (e) {
        return NextResponse.json({ error: 'Error' }, { status: 500 })
    }
}
