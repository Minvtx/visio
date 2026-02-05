import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { restoreVersion } from '@/lib/versioning'

// POST /api/pieces/[id]/restore - Restore a version
export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const body = await request.json()
        const { versionId } = body

        if (!versionId) {
            return NextResponse.json({ error: 'Version ID requerido' }, { status: 400 })
        }

        const restored = await restoreVersion(params.id, versionId)

        return NextResponse.json(restored)
    } catch (error) {
        console.error('Error restoring version:', error)
        return NextResponse.json({ error: 'Error al restaurar versión' }, { status: 500 })
    }
}
