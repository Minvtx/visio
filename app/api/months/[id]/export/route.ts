import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/months/[id]/export?format=json|csv|txt
export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const format = searchParams.get('format') || 'json'

        // Get content month with all pieces
        const month = await prisma.contentMonth.findUnique({
            where: { id: params.id },
            include: {
                client: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                    },
                },
                pieces: {
                    orderBy: { order: 'asc' },
                },
            },
        })

        if (!month) {
            return NextResponse.json({ error: 'Mes no encontrado' }, { status: 404 })
        }

        // Check access for clients
        if (session.user.role === 'CLIENT') {
            const client = await prisma.client.findFirst({
                where: {
                    id: month.clientId,
                    users: { some: { id: session.user.id } },
                },
            })
            if (!client) {
                return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
            }
        }

        const MONTH_NAMES = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

        const monthName = MONTH_NAMES[month.month]

        if (format === 'csv') {
            // Generate CSV
            const headers = ['Fecha', 'Formato', 'Pilar', 'Título', 'Copy', 'Hashtags', 'Brief Visual', 'Estado']
            const rows = month.pieces.map((piece) => {
                let copyText = ''
                try {
                    if (typeof piece.copy === 'string') {
                        const parsed = JSON.parse(piece.copy)
                        copyText = parsed.captionLong || piece.copy
                    } else if (typeof piece.copy === 'object' && piece.copy !== null) {
                        copyText = (piece.copy as any).captionLong || ''
                    }
                } catch {
                    copyText = String(piece.copy || '')
                }

                return [
                    piece.suggestedDate?.toLocaleDateString('es-AR') || '',
                    piece.type,
                    piece.pillar || '',
                    piece.title,
                    `"${copyText.replace(/"/g, '""')}"`,
                    piece.hashtags.join(' '),
                    `"${(piece.visualBrief || '').replace(/"/g, '""')}"`,
                    piece.status,
                ].join(',')
            })

            const csv = [headers.join(','), ...rows].join('\n')

            return new NextResponse(csv, {
                headers: {
                    'Content-Type': 'text/csv; charset=utf-8',
                    'Content-Disposition': `attachment; filename="${month.client.slug}-${monthName}-${month.year}.csv"`,
                },
            })
        }

        if (format === 'txt') {
            // Generate readable text format for easy copy-paste
            let txt = `=== CONTENIDO ${monthName.toUpperCase()} ${month.year} ===\n`
            txt += `Cliente: ${month.client.name}\n`
            txt += `Total piezas: ${month.pieces.length}\n`
            txt += `\n${'='.repeat(60)}\n\n`

            month.pieces.forEach((piece, index) => {
                let copyText = ''
                try {
                    if (typeof piece.copy === 'string') {
                        const parsed = JSON.parse(piece.copy)
                        copyText = parsed.captionLong || piece.copy
                    } else if (typeof piece.copy === 'object' && piece.copy !== null) {
                        copyText = (piece.copy as any).captionLong || ''
                    }
                } catch {
                    copyText = String(piece.copy || '')
                }

                txt += `📌 PIEZA ${index + 1}: ${piece.type}\n`
                txt += `📅 Fecha: ${piece.suggestedDate?.toLocaleDateString('es-AR') || 'Sin fecha'}\n`
                txt += `🏷️ Pilar: ${piece.pillar || 'N/A'}\n`
                txt += `\n✏️ TÍTULO/HOOK:\n${piece.title}\n`
                txt += `\n📝 COPY:\n${copyText}\n`
                txt += `\n#️⃣ HASHTAGS:\n${piece.hashtags.join(' ')}\n`
                if (piece.visualBrief) {
                    txt += `\n🎨 BRIEF VISUAL:\n${piece.visualBrief}\n`
                }
                txt += `\n${'─'.repeat(60)}\n\n`
            })

            return new NextResponse(txt, {
                headers: {
                    'Content-Type': 'text/plain; charset=utf-8',
                    'Content-Disposition': `attachment; filename="${month.client.slug}-${monthName}-${month.year}.txt"`,
                },
            })
        }

        // Default: JSON format
        const exportData = {
            client: month.client,
            month: monthName,
            year: month.year,
            status: month.status,
            strategy: month.strategy,
            totalPieces: month.pieces.length,
            pieces: month.pieces.map((piece) => {
                let copyParsed: any = {}
                try {
                    if (typeof piece.copy === 'string') {
                        copyParsed = JSON.parse(piece.copy)
                    } else if (typeof piece.copy === 'object' && piece.copy !== null) {
                        copyParsed = piece.copy
                    }
                } catch {
                    copyParsed = { raw: piece.copy }
                }

                return {
                    format: piece.type,
                    date: piece.suggestedDate?.toISOString().split('T')[0],
                    pillar: piece.pillar,
                    title: piece.title,
                    copy: copyParsed,
                    hashtags: piece.hashtags,
                    visualBrief: piece.visualBrief,
                    status: piece.status,
                    metadata: piece.metadata,
                }
            }),
            exportedAt: new Date().toISOString(),
        }

        return new NextResponse(JSON.stringify(exportData, null, 2), {
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'Content-Disposition': `attachment; filename="${month.client.slug}-${monthName}-${month.year}.json"`,
            },
        })
    } catch (error) {
        console.error('Error exporting month:', error)
        return NextResponse.json({ error: 'Error al exportar' }, { status: 500 })
    }
}
