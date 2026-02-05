import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PATCH /api/clients/[id]/plan - Assign a plan to a client
export async function PATCH(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const body = await request.json()
        const { planId } = body

        if (!planId) {
            return NextResponse.json({ error: 'Plan ID requerido' }, { status: 400 })
        }

        // Verify plan exists
        const plan = await prisma.plan.findUnique({
            where: { id: planId },
        })

        if (!plan) {
            return NextResponse.json({ error: 'Plan no encontrado' }, { status: 404 })
        }

        // Update client's plan
        const client = await prisma.client.update({
            where: { id: params.id },
            data: { planId },
            include: {
                plan: true,
            },
        })

        return NextResponse.json(client)
    } catch (error) {
        console.error('Error assigning plan:', error)
        return NextResponse.json({ error: 'Error al asignar plan' }, { status: 500 })
    }
}
