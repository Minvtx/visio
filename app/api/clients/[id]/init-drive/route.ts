import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { googleServices } from '@/lib/google-services'

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const clientId = params.id
        const client = await (prisma as any).client.findUnique({
            where: { id: clientId },
        })

        if (!client) {
            return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })
        }

        if ((client as any).googleDriveFolderId) {
            return NextResponse.json({
                success: true,
                message: 'Folder ya existe',
                folderId: (client as any).googleDriveFolderId
            })
        }

        console.log(`[DriveSync] Creating folder for client: ${client.name}...`)

        // Check if user has Google connection
        const isConnected = await googleServices.checkConnection(session.user.id)
        if (!isConnected) {
            return NextResponse.json({
                error: 'No has conectado tu cuenta de Google',
                code: 'NO_GOOGLE_CONNECTION'
            }, { status: 400 })
        }

        // Create the folder in Google Drive
        const folder = await googleServices.createDriveFolder(session.user.id, `VISIO - ${client.name}`)

        // Update client record
        await (prisma as any).client.update({
            where: { id: clientId },
            data: {
                googleDriveFolderId: folder.id,
            },
        })

        return NextResponse.json({
            success: true,
            folderId: folder.id,
            name: folder.name,
        })

    } catch (error) {
        console.error('[DriveSync] Fatal error:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Error interno al crear folder' },
            { status: 500 }
        )
    }
}
