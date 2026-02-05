import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/portal/months - Get all available months for client
export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        // Get client associated with user
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            include: {
                client: true,
            },
        })

        if (!user?.client) {
            return NextResponse.json({ error: 'No tienes un cliente asociado' }, { status: 403 })
        }

        const clientId = user.client.id

        // Get all content months for this client
        const months = await prisma.contentMonth.findMany({
            where: {
                clientId,
                status: { in: ['GENERATED', 'IN_REVIEW', 'APPROVED', 'LOCKED', 'EXPORTED'] },
            },
            orderBy: [{ year: 'desc' }, { month: 'desc' }],
            include: {
                _count: {
                    select: { pieces: true },
                },
                pieces: {
                    select: { status: true },
                },
            },
        })

        const MONTH_NAMES = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

        return NextResponse.json({
            months: months.map(m => {
                const approved = m.pieces.filter(p => p.status === 'APPROVED').length
                const total = m.pieces.length

                return {
                    id: m.id,
                    name: `${MONTH_NAMES[m.month]} ${m.year}`,
                    month: m.month,
                    year: m.year,
                    status: m.status,
                    totalPieces: total,
                    approvedPieces: approved,
                    progress: total > 0 ? Math.round((approved / total) * 100) : 0,
                }
            }),
        })
    } catch (error) {
        console.error('Error fetching portal months:', error)
        return NextResponse.json({ error: 'Error al obtener meses' }, { status: 500 })
    }
}
