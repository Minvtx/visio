import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PATCH /api/months/[id]/strategy
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

        // Allowed fields for strategy update
        const allowedFields = [
            'primaryObjective',
            'specificGoal',
            'kpis',
            'seasonality',
            'relevantDates',
            'industryTrends',
            'activeCampaigns',
            'contentPillars',
            'strategicInputs'
        ]

        const dataToUpdate: any = {}
        for (const field of allowedFields) {
            if (body[field] !== undefined) {
                dataToUpdate[field] = body[field]
            }
        }

        const contentMonth = await prisma.contentMonth.update({
            where: { id: params.id },
            data: dataToUpdate,
        })

        return NextResponse.json(contentMonth)
    } catch (error) {
        console.error('Error updating month strategy:', error)
        return NextResponse.json({ error: 'Error al actualizar estrategia' }, { status: 500 })
    }
}
