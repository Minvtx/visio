'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AssetUploader } from '@/components/assets/asset-uploader'
import { JobMonitor } from '@/components/jobs/job-monitor'
import { BrandKitEditor } from '@/components/clients/brand-kit-editor'
import { StatusBadge } from '@/components/ui/badge'
import { KanbanBoard } from '@/components/months/kanban-board'
import {
    ArrowLeft,
    Calendar,
    List,
    Sparkles,
    Download,
    RotateCcw,
    Plus,
    Loader2,
    FileText,
    FileSpreadsheet,
    FileJson,
    ChevronDown,
    LayoutGrid,
    X,
    AlertTriangle,
    Trash2
} from 'lucide-react'
import Link from 'next/link'
import {
    DndContext,
    DragOverlay,
    useDraggable,
    useDroppable,
    MouseSensor,
    TouchSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'

const MONTH_NAMES = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

const formatEmojis: Record<string, string> = {
    POST: '📷',
    CAROUSEL: '🎠',
    REEL: '🎬',
    STORY: '📱',
}

const pillarColors: Record<string, string> = {
    'Educación': 'bg-indigo-500',
    'Producto': 'bg-purple-500',
    'Social Proof': 'bg-violet-500',
    'Cultura': 'bg-fuchsia-500',
    'Ventas': 'bg-emerald-500',
    'Entretenimiento': 'bg-amber-500',
    'Inspiración': 'bg-rose-500'
}

const getPillarColor = (pillar: string) => {
    if (pillarColors[pillar]) return pillarColors[pillar]
    return 'bg-blue-500' // fallback
}

const statusColors: Record<string, string> = {
    'APPROVED': 'border-l-emerald-500',
    'PENDING_REVIEW': 'border-l-amber-500',
    'DRAFT': 'border-l-gray-500',
}

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

// --- DnD Components ---

function DraggablePiece({ piece, children }: { piece: any, children: React.ReactNode }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: piece.id,
        data: piece
    })

    const style = transform ? {
        transform: CSS.Translate.toString(transform),
        zIndex: isDragging ? 50 : undefined,
        opacity: isDragging ? 0.3 : 1,
        cursor: 'grab'
    } : { cursor: 'grab' }

    return (
        <div ref={setNodeRef} style={style} {...listeners} {...attributes} className="touch-none relative">
            {children}
        </div>
    )
}

function DroppableDay({ day, children, disabled }: { day: number | null, children: React.ReactNode, disabled?: boolean }) {
    const { setNodeRef, isOver } = useDroppable({
        id: day !== null ? day.toString() : 'void',
        disabled: disabled || day === null
    })

    return (
        <div
            ref={setNodeRef}
            className={`min-h-[140px] p-2 border-b border-r border-border last:border-r-0 transition-colors ${day === null ? 'bg-secondary/20' : isOver ? 'bg-primary/10 ring-2 ring-inset ring-primary' : 'bg-background hover:bg-secondary/5'
                }`}
        >
            {children}
        </div>
    )
}

function PieceCard({ piece }: { piece: any }) {
    return (
        <div
            className={`block p-1.5 rounded-md text-[10px] sm:text-xs border-l-2 bg-secondary/40 shadow-sm ${statusColors[piece.status] || 'border-l-gray-400'}`}
        >
            <div className="flex items-center gap-1 mb-0.5">
                <span>{formatEmojis[piece.type || piece.format]}</span>
                <span className="font-medium truncate">{piece.title || 'Sin título'}</span>
            </div>
            {piece.pillar && (
                <div className="flex items-center gap-1">
                    <span className={`inline-block w-1.5 h-1.5 rounded-full ${getPillarColor(piece.pillar)}`} />
                    <span className="text-muted-foreground truncate">{piece.pillar}</span>
                </div>
            )}
        </div>
    )
}

// --- Main Page (Force Redeploy - Production Check) ---

export default function ContentMonthPage() {
    const params = useParams()
    const clientId = params.id as string
    const monthId = params.monthId as string

    const [view, setView] = useState<'calendar' | 'list' | 'kanban'>('calendar')
    const [loading, setLoading] = useState(true)
    const [monthData, setMonthData] = useState<any>(null)
    const [error, setError] = useState('')
    const [showExportMenu, setShowExportMenu] = useState(false)
    const [exporting, setExporting] = useState<string | null>(null)
    const [syncingCalendar, setSyncingCalendar] = useState(false)
    const [activePiece, setActivePiece] = useState<any>(null)
    const [generating, setGenerating] = useState(false)
    const [genProgress, setGenProgress] = useState(0)
    const [genStatus, setGenStatus] = useState('')
    const [genPieceCount, setGenPieceCount] = useState({ done: 0, total: 0 })
    const [deleting, setDeleting] = useState(false)
    const [resetting, setResetting] = useState(false)

    const sensors = useSensors(
        useSensor(MouseSensor, { activationConstraint: { distance: 10 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
    )

    // --- UTILS ---
    const safeFetch = async (url: string, options: any, maxRetries = 3) => {
        let lastError: any;
        for (let i = 0; i < maxRetries; i++) {
            try {
                const res = await fetch(url, options);
                if (res.ok) return res;

                // If it's a server error but not a 504/408/502, we might not want to retry
                // but for AI, sometimes a 500 is just a temporary overload.
                const data = await res.json().catch(() => ({}));
                lastError = new Error(data.error || `Error ${res.status}`);

                console.warn(`Attempt ${i + 1} failed: ${lastError.message}. Retrying...`);
                await new Promise(r => setTimeout(r, 2000)); // wait 2s
            } catch (err: any) {
                lastError = err;
                console.warn(`Attempt ${i + 1} network error: ${err.message}. Retrying...`);
                await new Promise(r => setTimeout(r, 2000));
            }
        }
        throw lastError;
    };

    const fetchMonth = async () => {
        try {
            const res = await fetch(`/api/months/${monthId}?t=${Date.now()}`)
            if (!res.ok) throw new Error('Error al cargar mes')
            const data = await res.json()
            setMonthData(data)
            return data
        } catch (err) {
            console.error(err)
            setError('No se pudo cargar la información del mes')
            return null
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchMonth()
    }, [monthId])

    // ─── POLLING FOR BACKGROUND GENERATION ───
    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;

        if (monthData?.status === 'GENERATING') {
            setGenerating(true);
            setGenStatus('⏳ Generando en segundo plano... Las piezas aparecerán automáticamente.');

            interval = setInterval(async () => {
                const refreshed = await fetchMonth();
                // ONLY close if we got a valid response AND status is no longer GENERATING
                if (refreshed && refreshed.status !== 'GENERATING') {
                    setGenerating(false);
                    if (interval) clearInterval(interval);
                }
            }, 6000); // Poll every 6s
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [monthData?.status]);

    // ─── SYNC CALENDAR ───
    const handleSyncCalendar = async () => {
        setSyncingCalendar(true)
        try {
            const res = await fetch(`/api/months/${monthId}/sync-calendar`, {
                method: 'POST',
            })
            if (!res.ok) throw new Error('Error al sincronizar')
            const data = await res.json()
            alert(`Sincronización completada: ${data.processed} eventos creados.`)
        } catch (err) {
            console.error(err)
            setError('Error al sincronizar con Google Calendar')
        } finally {
            setSyncingCalendar(false)
        }
    }

    // ─── EXPORT ───
    const handleExport = async (format: 'json' | 'csv' | 'txt') => {
        setExporting(format)
        setShowExportMenu(false)
        try {
            const res = await fetch(`/api/months/${monthId}/export?format=${format}`)
            if (!res.ok) throw new Error('Error al exportar')

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
            setError('Error al exportar')
        } finally {
            setExporting(null)
        }
    }

    // ─── RESET MONTH (unstick from GENERATING) ───
    const handleResetMonth = async () => {
        if (!confirm('¿Resetear este mes a borrador? Se eliminarán las piezas generadas parcialmente.')) return
        setResetting(true)
        setError('')
        try {
            const res = await fetch(`/api/months/${monthId}/reset`, {
                method: 'POST',
            })
            if (!res.ok) {
                const data = await res.json().catch(() => ({}))
                throw new Error(data.error || 'Error al resetear')
            }
            await fetchMonth()
        } catch (err: any) {
            console.error(err)
            setError(err.message || 'Error al resetear el mes')
        } finally {
            setResetting(false)
        }
    }

    // ─── DELETE MONTH ───
    const handleDeleteMonth = async () => {
        if (!confirm('¿Seguro que quieres ELIMINAR este mes? Se borrará todo el contenido, estrategia y feedback permanentemente.')) return
        setDeleting(true)
        setError('')
        try {
            const res = await fetch(`/api/months/${monthId}`, {
                method: 'DELETE',
            })
            if (!res.ok) {
                const data = await res.json().catch(() => ({}))
                throw new Error(data.error || 'Error al eliminar')
            }
            // Navigate back to client page
            window.location.href = `/admin/clients/${clientId}`
        } catch (err: any) {
            console.error(err)
            setError(err.message || 'No se pudo eliminar el mes')
            setDeleting(false)
        }
    }

    // ─── REGENERATE (Background Job via Inngest) ───
    const handleRegenerate = async (e?: React.MouseEvent) => {
        if (e) e.preventDefault()
        if (generating) return

        if (!confirm('¿Estás seguro? Esto borrará las piezas actuales y generará nuevas en segundo plano.')) return

        try {
            setGenerating(true)
            setGenProgress(0)
            setGenStatus('🚀 Iniciando motor de IA en segundo plano...')

            // 1. Trigger the background job
            const res = await fetch(`/api/months/${monthId}/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            })

            if (!res.ok) {
                const errorData = await res.json()
                throw new Error(errorData.error || 'Error iniciando generación')
            }

            // 2. Immediately refresh status
            setGenStatus('✅ Trabajo enviado correctamente.')
            await fetchMonth()

        } catch (err: any) {
            console.error('Error generación:', err)
            // DO NOT setGenerating(false) here, let the user see the error in the wizard
            setGenStatus(`❌ Error: ${err.message}`)
            setError(`❌ Error: ${err.message}`)
            // Reset backend state
            fetch(`/api/months/${monthId}/reset`, { method: 'POST' }).catch(() => { })
        }
    }

    // ─── DND HANDLERS ───
    const handleDragStart = (event: any) => {
        const piece = event.active.data.current
        setActivePiece(piece)
    }

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event
        setActivePiece(null)

        if (over && active.id !== over.id) {
            const newDay = parseInt(over.id as string)
            if (isNaN(newDay)) return

            const pieceId = active.id
            const pcs = [...(monthData.pieces || [])]
            const pieceIndex = pcs.findIndex((p: any) => p.id === pieceId)

            if (pieceIndex === -1) return

            const piece = pcs[pieceIndex]
            const oldDate = new Date(piece.suggestedDate)

            if (oldDate.getDate() === newDay && oldDate.getMonth() === monthData.month - 1) return

            const newDate = new Date(monthData.year, monthData.month - 1, newDay, 12, 0, 0)
            const updatedPiece = { ...piece, suggestedDate: newDate.toISOString() }
            pcs[pieceIndex] = updatedPiece

            setMonthData({ ...monthData, pieces: pcs })

            try {
                const res = await fetch(`/api/pieces/${pieceId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ suggestedDate: newDate.toISOString() }),
                })
                if (!res.ok) throw new Error('Failed to update')
            } catch (err) {
                console.error('Failed to move piece:', err)
                fetchMonth() // Revert
            }
        }
    }

    // ─── LOADING / ERROR STATES ───
    if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>

    if (!monthData) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="text-red-500 text-lg">{error || 'Mes no encontrado'}</div>
                <Link href={`/admin/clients/${clientId}`}>
                    <Button variant="outline">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Volver al Cliente
                    </Button>
                </Link>
            </div>
        )
    }

    const strategy = monthData.strategy || {}
    const tiers = strategy.contentPillars || []
    const pieces = monthData.pieces || []
    const isStuck = monthData.status === 'GENERATING' && !generating

    const stats = {
        total: pieces.length,
        approved: pieces.filter((p: any) => p.status === 'APPROVED').length,
        pending: pieces.filter((p: any) => p.status === 'PENDING_REVIEW' || p.status === 'IN_REVIEW').length,
        draft: pieces.filter((p: any) => p.status === 'DRAFT').length,
    }

    const firstDay = new Date(monthData.year, monthData.month - 1, 1)
    const lastDay = new Date(monthData.year, monthData.month, 0)
    const startOffset = firstDay.getDay()
    const daysInMonth = lastDay.getDate()

    const calendarDays = []
    for (let i = 0; i < startOffset; i++) {
        calendarDays.push({ day: null, pieces: [] })
    }
    for (let day = 1; day <= daysInMonth; day++) {
        const dayPieces = pieces.filter((p: any) => {
            if (!p.suggestedDate) return false
            const pDate = new Date(p.suggestedDate)
            return pDate.getDate() === day && pDate.getMonth() === monthData.month - 1
        })
        calendarDays.push({ day, pieces: dayPieces })
    }

    const pillarsDisplay = Array.isArray(tiers) ? tiers.map((p: any) => ({
        name: typeof p === 'string' ? p : p.name,
        percentage: 100 / tiers.length,
        color: getPillarColor(typeof p === 'string' ? p : p.name)
    })) : []

    return (
        <div className="space-y-6">
            {/* Back Link */}
            <Link
                href={`/admin/clients/${clientId}`}
                className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
                <ArrowLeft className="w-4 h-4" />
                Volver a {monthData.client?.name || 'Cliente'}
            </Link>

            {/* Error Banner */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-lg flex items-center justify-between animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5" />
                        <span className="font-medium">{error}</span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setError('')} className="hover:bg-red-500/10 text-red-500">
                        <X className="w-4 h-4" />
                    </Button>
                </div>
            )}

            {/* ⚠️ STUCK MONTH BANNER - This is the KEY fix */}
            {isStuck && (
                <div className="bg-amber-500/10 border-2 border-amber-500/40 text-amber-700 dark:text-amber-400 p-6 rounded-xl animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-start gap-4">
                        <AlertTriangle className="w-8 h-8 shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <h3 className="text-lg font-bold mb-1">Este mes se quedó trabado en &quot;Generando&quot;</h3>
                            <p className="text-sm opacity-80 mb-4">
                                La generación anterior falló o se interrumpió. Tenés dos opciones:
                            </p>
                            <div className="flex flex-wrap gap-3">
                                <Button
                                    onClick={handleResetMonth}
                                    disabled={resetting}
                                    variant="outline"
                                    className="border-amber-500/50 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10"
                                >
                                    {resetting ? (
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    ) : (
                                        <RotateCcw className="w-4 h-4 mr-2" />
                                    )}
                                    Resetear a Borrador
                                </Button>
                                <Button
                                    onClick={handleRegenerate}
                                    disabled={generating}
                                    className="bg-amber-600 hover:bg-amber-700 text-white"
                                >
                                    {generating ? (
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    ) : (
                                        <Sparkles className="w-4 h-4 mr-2" />
                                    )}
                                    Regenerar Todo
                                </Button>
                                <Button
                                    onClick={handleDeleteMonth}
                                    disabled={deleting}
                                    variant="outline"
                                    className="border-red-500/50 text-red-600 hover:bg-red-500/10"
                                >
                                    {deleting ? (
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    ) : (
                                        <Trash2 className="w-4 h-4 mr-2" />
                                    )}
                                    Eliminar Mes
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold">{MONTH_NAMES[monthData.month]} {monthData.year}</h1>
                        <StatusBadge status={monthData.status} />
                    </div>
                    <p className="text-muted-foreground mt-1">{monthData.client?.name}</p>
                </div>
                <div className="flex gap-2 flex-wrap relative">
                    <Button
                        variant="outline"
                        size="sm"
                        className="text-xs border-blue-500/30 text-blue-600"
                        onClick={() => {
                            alert('Ejecutando diagnóstico completo... Esto puede tardar 30s. Esperá el resultado.')
                            fetch(`/api/months/${monthId}/debug-generate`)
                                .then(r => r.json())
                                .then(d => {
                                    const logsText = (d.logs || []).join('\n')
                                    alert(`Resultado: ${d.success ? '✅ OK' : '❌ FALLO'}\n\nError: ${d.error || 'ninguno'}\nPiezas en DB: ${d.piecesInDb || '?'}\n\nLogs:\n${logsText}`)
                                })
                                .catch(e => alert('Error de conexión: ' + e.message))
                        }}
                    >
                        🔬 Diagnosticar
                    </Button>
                    <Button
                        variant="outline"
                        onClick={handleSyncCalendar}
                        disabled={syncingCalendar}
                        className="border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-600 hover:text-emerald-700"
                    >
                        {syncingCalendar ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <Calendar className="w-4 h-4 mr-2" />
                        )}
                        Sincronizar Calendar
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => handleRegenerate()}
                        disabled={generating}
                    >
                        {generating ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <RotateCcw className="w-4 h-4 mr-2" />
                        )}
                        Regenerar Todo
                    </Button>
                    <Button
                        variant="outline"
                        onClick={handleDeleteMonth}
                        disabled={deleting}
                        className="border-red-500/30 text-red-600 hover:bg-red-500/5"
                    >
                        {deleting ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <Trash2 className="w-4 h-4 mr-2" />
                        )}
                        Eliminar Mes
                    </Button>
                    <div className="relative">
                        <Button
                            variant="outline"
                            onClick={() => setShowExportMenu(!showExportMenu)}
                            disabled={exporting !== null}
                        >
                            {exporting ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <Download className="w-4 h-4 mr-2" />
                            )}
                            Exportar
                            <ChevronDown className="w-4 h-4 ml-2" />
                        </Button>
                        {showExportMenu && (
                            <div className="absolute right-0 top-full mt-1 w-48 bg-card border border-border rounded-lg shadow-lg z-50 py-1">
                                <button onClick={() => handleExport('txt')} className="w-full px-4 py-2 text-left text-sm hover:bg-secondary flex items-center gap-2"><FileText className="w-4 h-4" /> Texto (TXT)</button>
                                <button onClick={() => handleExport('csv')} className="w-full px-4 py-2 text-left text-sm hover:bg-secondary flex items-center gap-2"><FileSpreadsheet className="w-4 h-4" /> Excel (CSV)</button>
                                <button onClick={() => handleExport('json')} className="w-full px-4 py-2 text-left text-sm hover:bg-secondary flex items-center gap-2"><FileJson className="w-4 h-4" /> JSON</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Strategy Bar */}
            {strategy && (
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-4">
                                {strategy?.monthlyObjective && (
                                    <div className="text-sm">
                                        <span className="text-muted-foreground">Objetivo: </span>
                                        <span className="font-medium">{strategy.monthlyObjective}</span>
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                <span>{stats.total} piezas</span>
                                {stats.approved > 0 && <span className="text-emerald-500">✓ {stats.approved}</span>}
                                {stats.pending > 0 && <span className="text-amber-500">⏳ {stats.pending}</span>}
                                {stats.draft > 0 && <span>📝 {stats.draft}</span>}
                            </div>
                        </div>
                        {pillarsDisplay.length > 0 && (
                            <div className="flex gap-1 h-2 rounded-full overflow-hidden">
                                {pillarsDisplay.map((pillar: any) => (
                                    <div key={pillar.name} className={`${pillar.color} transition-all`} style={{ width: `${pillar.percentage}%` }} title={pillar.name} />
                                ))}
                            </div>
                        )}
                        {pillarsDisplay.length > 0 && (
                            <div className="flex gap-4 mt-2 flex-wrap">
                                {pillarsDisplay.map((pillar: any) => (
                                    <div key={pillar.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                        <span className={`inline-block w-2 h-2 rounded-full ${pillar.color}`} />
                                        {pillar.name}
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* View Toggle */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    {strategy.keyDates && strategy.keyDates.length > 0 && (
                        <div className="text-xs text-muted-foreground">
                            📅 {strategy.keyDates.map((d: any) => `${d.date}: ${d.event}`).join(' | ')}
                        </div>
                    )}
                </div>
                <div className="flex bg-secondary/50 rounded-lg p-1 gap-1">
                    <button onClick={() => setView('calendar')} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${view === 'calendar' ? 'bg-background font-medium' : 'text-muted-foreground'}`}>
                        <Calendar className="w-4 h-4" /> Calendario
                    </button>
                    <button onClick={() => setView('kanban')} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${view === 'kanban' ? 'bg-background font-medium' : 'text-muted-foreground'}`}>
                        <LayoutGrid className="w-4 h-4" /> Kanban
                    </button>
                    <button onClick={() => setView('list')} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${view === 'list' ? 'bg-background font-medium' : 'text-muted-foreground'}`}>
                        <List className="w-4 h-4" /> Lista
                    </button>
                </div>
            </div>

            {/* Calendar View */}
            {view === 'calendar' && (
                <DndContext
                    sensors={sensors}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                >
                    <div className="border border-border rounded-xl overflow-hidden relative">
                        {/* Empty State Overlay */}
                        {pieces.length === 0 && !generating && (
                            <div className="absolute inset-0 z-10 bg-background/60 backdrop-blur-[2px] flex flex-col items-center justify-center p-6 text-center">
                                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                                    <Sparkles className="w-8 h-8 text-primary" />
                                </div>
                                <h3 className="text-xl font-bold mb-2">Este mes está vacío</h3>
                                <p className="text-muted-foreground max-w-sm mb-6">
                                    Hacé clic en el botón para que la IA genere toda la estrategia y las piezas de contenido automáticamente.
                                </p>
                                <div className="flex gap-3">
                                    <Button size="lg" onClick={() => handleRegenerate()} className="shadow-lg shadow-primary/20">
                                        <Sparkles className="w-4 h-4 mr-2" />
                                        Generar Todo el Mes
                                    </Button>
                                    <Button size="lg" variant="outline" onClick={handleDeleteMonth} className="border-red-500/30 text-red-600 hover:bg-red-500/5">
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Eliminar Mes
                                    </Button>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-7 bg-secondary/50">
                            {DAYS.map((day) => (
                                <div key={day} className="p-3 text-center text-sm font-medium text-muted-foreground border-b border-border">
                                    {day}
                                </div>
                            ))}
                        </div>
                        <div className="grid grid-cols-7 bg-background">
                            {calendarDays.map((cell: any, i) => (
                                <DroppableDay key={i} day={cell.day}>
                                    {cell.day !== null && (
                                        <>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className={`text-sm font-medium ${cell.pieces.length > 0 ? 'text-foreground' : 'text-muted-foreground'}`}>{cell.day}</span>
                                                {cell.pieces.length === 0 && (
                                                    <button className="w-5 h-5 rounded-full bg-secondary hover:bg-primary/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Plus className="w-3 h-3 text-muted-foreground" />
                                                    </button>
                                                )}
                                            </div>
                                            <div className="space-y-1">
                                                {cell.pieces.map((piece: any) => (
                                                    <DraggablePiece key={piece.id} piece={piece}>
                                                        <Link href={`/admin/pieces/${piece.id}`}>
                                                            <PieceCard piece={piece} />
                                                        </Link>
                                                    </DraggablePiece>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </DroppableDay>
                            ))}
                        </div>
                    </div>
                    <DragOverlay>
                        {activePiece ? <div className="w-[120px] sm:w-[150px]"><PieceCard piece={activePiece} /></div> : null}
                    </DragOverlay>
                </DndContext>
            )}

            {/* Other Views */}
            {view === 'kanban' && (
                <KanbanBoard
                    pieces={pieces}
                    onStatusChange={async (pieceId, newStatus) => {
                        try {
                            const res = await fetch(`/api/pieces/${pieceId}`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ status: newStatus }),
                            })
                            if (res.ok) fetchMonth()
                        } catch (err) {
                            console.error('Error updating status:', err)
                        }
                    }}
                />
            )}

            {view === 'list' && (
                <div className="space-y-2">
                    {pieces.map((piece: any) => (
                        <Link key={piece.id} href={`/admin/pieces/${piece.id}`}>
                            <Card className="hover:border-primary/50 transition-all cursor-pointer">
                                <CardContent className="p-3 flex items-center gap-4">
                                    <div className="w-16 text-center shrink-0">
                                        <div className="text-lg font-bold">{new Date(piece.suggestedDate).getDate()}</div>
                                        <div className="text-xs text-muted-foreground capitalize">{new Date(piece.suggestedDate).toLocaleDateString('es-AR', { weekday: 'short' })}</div>
                                    </div>
                                    <div className="w-px h-10 bg-border" />
                                    <span className="text-2xl">{formatEmojis[piece.type || piece.format]}</span>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium text-sm truncate">{piece.title}</div>
                                        <div className="flex items-center mt-1">
                                            <span className={`inline-block w-2 h-2 rounded-full mr-1 ${getPillarColor(piece.pillar)}`} />
                                            <span className="text-xs text-muted-foreground">{piece.pillar}</span>
                                        </div>
                                    </div>
                                    <StatusBadge status={piece.status} />
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}

            {/* Generation Overlay */}
            {generating && (
                <div className="fixed inset-0 bg-background/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
                    <div className="w-full max-w-md p-8">
                        <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 mx-auto animate-pulse">
                            <Sparkles className="w-10 h-10 text-primary" />
                        </div>
                        <h2 className="text-2xl font-bold text-center mb-2">Content Wizard trabajando...</h2>

                        {/* Progress bar */}
                        <div className="w-full bg-secondary rounded-full h-3 mb-3 overflow-hidden">
                            <div
                                className="bg-primary h-full rounded-full transition-all duration-500 ease-out"
                                style={{ width: `${genProgress}%` }}
                            />
                        </div>

                        <div className="flex justify-between text-sm text-muted-foreground mb-4">
                            <span>{genStatus}</span>
                            <span className="font-medium">{genProgress}%</span>
                        </div>

                        {genPieceCount.total > 0 && (
                            <div className="text-center text-sm text-muted-foreground mb-4">
                                {genPieceCount.done} de {genPieceCount.total} piezas generadas
                            </div>
                        )}

                        {(genStatus.startsWith('❌') || genProgress === 100) ? (
                            <Button className="w-full mt-4 bg-background border border-input hover:bg-accent hover:text-accent-foreground text-foreground" onClick={() => setGenerating(false)}>
                                Cerrar
                            </Button>
                        ) : (
                            <p className="text-center text-xs text-muted-foreground mt-6">
                                No cierres esta pestaña. Cada pieza se genera individualmente para evitar timeouts.
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
