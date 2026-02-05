import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

// Ensure uploads directory exists
const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads')

// GET /api/assets - List all assets for a client
export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const clientId = searchParams.get('clientId')

        if (!clientId) {
            return NextResponse.json({ error: 'clientId requerido' }, { status: 400 })
        }

        const assets = await prisma.asset.findMany({
            where: { clientId },
            orderBy: { uploadedAt: 'desc' },
        })

        return NextResponse.json(assets)
    } catch (error) {
        console.error('Error fetching assets:', error)
        return NextResponse.json({ error: 'Error al obtener assets' }, { status: 500 })
    }
}

// POST /api/assets - Upload new asset
export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const formData = await request.formData()
        const file = formData.get('file') as File
        const clientId = formData.get('clientId') as string
        const tags = formData.get('tags') as string

        if (!file || !clientId) {
            return NextResponse.json(
                { error: 'file y clientId son requeridos' },
                { status: 400 }
            )
        }

        // Verify client exists
        const client = await prisma.client.findUnique({
            where: { id: clientId },
        })

        if (!client) {
            return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })
        }

        // Create uploads directory if it doesn't exist
        await mkdir(UPLOADS_DIR, { recursive: true })

        // Generate unique filename
        const ext = path.extname(file.name)
        const uniqueName = `${uuidv4()}${ext}`
        const filePath = path.join(UPLOADS_DIR, uniqueName)

        // Convert File to Buffer and save
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)
        await writeFile(filePath, buffer)

        // Create asset record in database
        const asset = await prisma.asset.create({
            data: {
                clientId,
                filename: file.name,
                url: `/uploads/${uniqueName}`,
                mimeType: file.type,
                sizeBytes: file.size,
                tags: tags ? tags.split(',').map(t => t.trim()) : [],
            },
        })

        return NextResponse.json(asset)
    } catch (error) {
        console.error('Error uploading asset:', error)
        return NextResponse.json({ error: 'Error al subir archivo' }, { status: 500 })
    }
}

// DELETE /api/assets - Delete an asset
export async function DELETE(request: Request) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const assetId = searchParams.get('id')

        if (!assetId) {
            return NextResponse.json({ error: 'id requerido' }, { status: 400 })
        }

        const asset = await prisma.asset.findUnique({
            where: { id: assetId },
        })

        if (!asset) {
            return NextResponse.json({ error: 'Asset no encontrado' }, { status: 404 })
        }

        // Delete from database (file cleanup can be done separately)
        await prisma.asset.delete({
            where: { id: assetId },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting asset:', error)
        return NextResponse.json({ error: 'Error al eliminar asset' }, { status: 500 })
    }
}
