'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
    Download,
    FileJson,
    FileSpreadsheet,
    FileText,
    Loader2,
    ChevronLeft,
    CheckCircle,
    Calendar
} from 'lucide-react'
import Link from 'next/link'

interface MonthData {
    id: string
    name: string
    month: number
    year: number
    status: string
    totalPieces: number
    approvedPieces: number
    progress: number
}

export default function PortalDownloads() {
    const [months, setMonths] = useState<MonthData[]>([])
    const [loading, setLoading] = useState(true)
    const [downloading, setDownloading] = useState<string | null>(null)

    useEffect(() => {
        const fetchMonths = async () => {
            try {
                const res = await fetch('/api/portal/months')
                if (!res.ok) throw new Error('Error')
                const data = await res.json()
                setMonths(data.months || [])
            } catch (err) {
                console.error(err)
            } finally {
                setLoading(false)
            }
        }
        fetchMonths()
    }, [])

    const handleDownload = async (monthId: string, format: 'json' | 'csv' | 'txt') => {
        setDownloading(`${monthId}-${format}`)
        try {
            const res = await fetch(`/api/months/${monthId}/export?format=${format}`)
            if (!res.ok) throw new Error('Error al descargar')

            const blob = await res.blob()
            const contentDisposition = res.headers.get('Content-Disposition')
            let filename = `contenido.${format}`

            if (contentDisposition) {
                const match = contentDisposition.match(/filename="(.+)"/)
                if (match) filename = match[1]
            }

            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = filename
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)
        } catch (err) {
            console.error(err)
        } finally {
            setDownloading(null)
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Cargando descargas...</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center mb-8">
                <Link href="/portal" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Volver al inicio
                </Link>
                <h1 className="text-3xl font-bold mb-2">Descargas</h1>
                <p className="text-muted-foreground">
                    Descarga tu contenido en diferentes formatos
                </p>
            </div>

            {months.length === 0 ? (
                <Card className="p-8 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
                        <Download className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">No hay contenido disponible</h3>
                    <p className="text-muted-foreground">
                        Cuando tengas contenido aprobado, podrás descargarlo aquí.
                    </p>
                </Card>
            ) : (
                <div className="space-y-4">
                    {months.map((month) => (
                        <Card key={month.id} className="overflow-hidden">
                            <CardContent className="p-6">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    {/* Month Info */}
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${month.progress === 100
                                            ? 'bg-emerald-500/10'
                                            : 'bg-primary/10'
                                            }`}>
                                            {month.progress === 100 ? (
                                                <CheckCircle className="w-6 h-6 text-emerald-500" />
                                            ) : (
                                                <Calendar className="w-6 h-6 text-primary" />
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-lg">{month.name}</h3>
                                            <p className="text-sm text-muted-foreground">
                                                {month.approvedPieces}/{month.totalPieces} piezas aprobadas
                                            </p>
                                        </div>
                                    </div>

                                    {/* Download Buttons */}
                                    <div className="flex flex-wrap gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleDownload(month.id, 'txt')}
                                            disabled={downloading !== null}
                                        >
                                            {downloading === `${month.id}-txt` ? (
                                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                            ) : (
                                                <FileText className="w-4 h-4 mr-2" />
                                            )}
                                            TXT
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleDownload(month.id, 'csv')}
                                            disabled={downloading !== null}
                                        >
                                            {downloading === `${month.id}-csv` ? (
                                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                            ) : (
                                                <FileSpreadsheet className="w-4 h-4 mr-2" />
                                            )}
                                            CSV
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleDownload(month.id, 'json')}
                                            disabled={downloading !== null}
                                        >
                                            {downloading === `${month.id}-json` ? (
                                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                            ) : (
                                                <FileJson className="w-4 h-4 mr-2" />
                                            )}
                                            JSON
                                        </Button>
                                    </div>
                                </div>

                                {/* Progress bar */}
                                <div className="mt-4">
                                    <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 ${month.progress === 100
                                                ? 'bg-emerald-500'
                                                : 'gradient-primary'
                                                }`}
                                            style={{ width: `${month.progress}%` }}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Info Card */}
            <Card className="p-6 bg-primary/5 border-primary/20">
                <div className="flex gap-4">
                    <div className="text-2xl">💡</div>
                    <div>
                        <h4 className="font-semibold mb-1">Formatos disponibles</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                            <li><strong>TXT:</strong> Texto plano, ideal para copiar y pegar</li>
                            <li><strong>CSV:</strong> Para Excel o Google Sheets</li>
                            <li><strong>JSON:</strong> Para integración con otras herramientas</li>
                        </ul>
                    </div>
                </div>
            </Card>
        </div>
    )
}
