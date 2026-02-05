import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/pieces/[id]/versions - List versions metadata
export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const versions = await prisma.contentPieceVersion.findMany({
            where: { pieceId: params.id },
            select: {
                id: true,
                versionNumber: true,
                createdAt: true,
                changelog: true,
                createdBy: true,
                // We don't select full copy/visualBrief to keep it light
            },
            orderBy: { versionNumber: 'desc' }
        })

        return NextResponse.json(versions)
    } catch (error) {
        console.error('Error fetching versions:', error)
        return NextResponse.json({ error: 'Error al obtener versiones' }, { status: 500 })
    }
}
