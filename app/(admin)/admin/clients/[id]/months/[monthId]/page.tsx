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
    X
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
    // Determine visual style - exact copy of the Link content below
    return (
        <div
            className={`block p-1.5 rounded-md text-[10px] sm:text-xs border-l-2 bg-secondary/40 shadow-sm ${statusColors[piece.status] || 'border-l-gray-400'}`}
        >
            <div className="flex items-center gap-1 mb-0.5">
                <span>{formatEmojis[piece.type || piece.format]}</span>
                <span className={`w-1.5 h-1.5 rounded-full ${getPillarColor(piece.pillar)}`} />
            </div>
            <div className="font-medium truncate leading-tight">
                {piece.title}
            </div>
        </div>
    )
}

// --- Main Page ---

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
    const [activePiece, setActivePiece] = useState<any>(null) // For DragOverlay
    const [currentJobId, setCurrentJobId] = useState<string | null>(null)
    const [generating, setGenerating] = useState(false)

    const sensors = useSensors(
        useSensor(MouseSensor, { activationConstraint: { distance: 10 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
    )

    const fetchMonth = async () => {
        try {
            const res = await fetch(`/api/months/${monthId}`)
            if (!res.ok) throw new Error('Error al cargar mes')
            const data = await res.json()
            setMonthData(data)
        } catch (err) {
            console.error(err)
            setError('No se pudo cargar la información del mes')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchMonth()
    }, [monthId])

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

    const handleResetMonth = async () => {
        if (!confirm('¿Seguro que quieres resetear el estado de este mes? Esto desbloqueará el botón de generación si se quedó trabado.')) return
        setLoading(true)
        try {
            const res = await fetch(`/api/months/${monthId}/reset`, {
                method: 'POST',
            })
            if (!res.ok) throw new Error('Error al resetear')
            await fetchMonth()
        } catch (err) {
            console.error(err)
            setError('Error al resetear el mes')
        } finally {
            setLoading(false)
        }
    }

    const handleRegenerate = async () => {
        if (!confirm('¿Seguro que quieres borrar todo el contenido actual y generar este mes?')) return
        setGenerating(true)
        setError('')
        setLoading(true)

        try {
            // 1. Reset state
            await fetch(`/api/months/${monthId}/reset`, { method: 'POST' })

            // 2. Start Strategy
            const resStrat = await fetch(`/api/months/${monthId}/generate-step`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ step: 'strategy' })
            })
            if (!resStrat.ok) throw new Error('Error al iniciar estrategia')

            // 3. Generate pieces one by one (Incremental)
            let currentIdx = 0
            let completed = false
            const total = monthData.client?.plan?.postsPerMonth || 12

            while (!completed && currentIdx < 30) { // Limit 30 to avoid infinite loops
                const resPiece = await fetch(`/api/months/${monthId}/generate-step`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ step: 'piece', pieceIndex: currentIdx })
                })

                if (!resPiece.ok) throw new Error(`Error en pieza ${currentIdx}`)

                const data = await resPiece.json()
                completed = data.completed
                currentIdx = data.nextIndex

                // Update progress visually if we had a state for it
                console.log(`Progreso: ${data.progress}%`)
            }

            await fetchMonth()
        } catch (err: any) {
            console.error(err)
            setError(err.message || 'Error en la generación incremental')
        } finally {
            setGenerating(false)
            setLoading(false)
        }
    }

    const handleJobComplete = async () => {
        setGenerating(false)
        setCurrentJobId(null)
        await fetchMonth()
    }

    const handleJobError = (err: any) => {
        setError(typeof err === 'string' ? err : 'Error en la generación')
        setGenerating(false)
        setCurrentJobId(null)
    }

    const handleDeleteMonth = async () => {
        if (!confirm('¿Seguro que quieres ELIMINAR este mes? Se borrará todo el contenido, estrategia y feedback permanentemente.')) return
        setLoading(true)
        try {
            const res = await fetch(`/api/months/${monthId}`, {
                method: 'DELETE',
            })
            if (!res.ok) throw new Error('Error al eliminar')
            window.location.href = `/admin/clients/${clientId}`
        } catch (err) {
            console.error(err)
            setError('No se pudo eliminar el mes')
            setLoading(false)
        }
    }

    const handleDragStart = (event: any) => {
        const piece = event.active.data.current
        setActivePiece(piece)
    }

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event
        setActivePiece(null)

        if (over && active.id !== over.id) {
            const newDay = parseInt(over.id as string)
            if (isNaN(newDay)) return // Dropped on non-day

            const pieceId = active.id

            // Find current piece data
            const pieces = [...(monthData.pieces || [])]
            const pieceIndex = pieces.findIndex((p: any) => p.id === pieceId)

            if (pieceIndex === -1) return

            const piece = pieces[pieceIndex]
            const oldDate = new Date(piece.suggestedDate)

            // Should verify if day changed actually?
            // over.id is newDay.
            // Check if user dropped on same date
            if (oldDate.getDate() === newDay && oldDate.getMonth() === monthData.month - 1) return

            // Calculate new date (preserve year/month, set day)
            // Use local date construction to avoid timezone jumps if possible, or UTC?
            // suggestedDate is ISO.
            // Let's create date in same month/year.
            const newDate = new Date(monthData.year, monthData.month - 1, newDay, 12, 0, 0) // Midday to be safe

            // Optimistic Update
            const updatedPiece = { ...piece, suggestedDate: newDate.toISOString() }
            pieces[pieceIndex] = updatedPiece

            setMonthData({ ...monthData, pieces })

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

    if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
    if (error || !monthData) return <div className="text-center py-20 text-red-500">{error || 'Mes no encontrado'}</div>

    const strategy = monthData.strategy || {}
    const tiers = strategy.contentPillars || []
    const pieces = monthData.pieces || []

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

            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold">{MONTH_NAMES[monthData.month]} {monthData.year}</h1>
                        <StatusBadge status={monthData.status} />
                    </div>
                    <p className="text-muted-foreground mt-1">{monthData.client?.name}</p>
                </div>
                <div className="flex gap-2 relative">
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
                    <Button variant="outline" onClick={handleRegenerate}>
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Regenerar Todo
                    </Button>
                    <Button
                        variant="outline"
                        onClick={handleDeleteMonth}
                        className="border-red-500/30 text-red-600 hover:bg-red-500/5"
                    >
                        <X className="w-4 h-4 mr-2" />
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
                    <Button onClick={() => { }}>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Mejorar con IA
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleResetMonth}
                        className="text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                        title="Resetear estado si se quedó trabado en Generando"
                    >
                        <RotateCcw className="w-3 h-3 mr-1" />
                        Reset Estado
                    </Button>
                </div>
            </div>

            {/* Strategy Bar */}
            {strategy && (
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-4">
                                <div><span className="text-sm text-muted-foreground">Objetivo:</span><span className="ml-2 font-medium">{strategy.primaryObjective || 'No definido'}</span></div>
                                <div className="h-4 w-px bg-border" />
                                <div><span className="text-sm text-muted-foreground">KPI:</span><span className="ml-2 font-medium">{strategy.specificGoal || '-'}</span></div>
                            </div>
                            <div className="flex items-center gap-6 text-sm">
                                <span><strong className="text-foreground">{stats.total}</strong> piezas</span>
                                <span className="text-emerald-500"><strong>{stats.approved}</strong> aprobadas</span>
                                <span className="text-amber-500"><strong>{stats.pending}</strong> pendientes</span>
                            </div>
                        </div>
                        {pillarsDisplay.length > 0 && (
                            <>
                                <div className="flex h-2 rounded-full overflow-hidden bg-secondary">
                                    {pillarsDisplay.map((pillar: any, i: number) => (
                                        <div key={i} style={{ width: `${pillar.percentage}%` }} className={`${pillar.color} h-full`} title={pillar.name} />
                                    ))}
                                </div>
                                <div className="flex gap-4 mt-2 text-xs flex-wrap">
                                    {pillarsDisplay.map((pillar: any, i: number) => (
                                        <span key={i} className="flex items-center gap-1"><span className={`w-2 h-2 rounded-full ${pillar.color}`} />{pillar.name}</span>
                                    ))}
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* View Toggle */}
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Calendario de Contenido
                </h2>
                <div className="flex gap-1 p-1 bg-secondary rounded-lg">
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
                        {pieces.length === 0 && monthData.status === 'DRAFT' && !generating && (
                            <div className="absolute inset-0 z-10 bg-background/60 backdrop-blur-[2px] flex flex-col items-center justify-center p-6 text-center">
                                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                                    <Sparkles className="w-8 h-8 text-primary" />
                                </div>
                                <h3 className="text-xl font-bold mb-2">Este mes está vacío</h3>
                                <p className="text-muted-foreground max-w-sm mb-6">
                                    Haz clic en el botón para que la IA genere toda la estrategia y las piezas de contenido automáticamente.
                                </p>
                                <Button size="lg" onClick={handleRegenerate} className="shadow-lg shadow-primary/20">
                                    <Sparkles className="w-4 h-4 mr-2" />
                                    Generar Todo el Mes
                                </Button>
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
                                                        <Link
                                                            href={`/admin/pieces/${piece.id}`}
                                                        // We prevent default drag behavior of Link/Anchor by touch-none on parent, 
                                                        // but on click we want navigation.
                                                        // DnD Kit allows interaction if not dragging.
                                                        >
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

            {currentJobId && (
                <JobMonitor
                    jobId={currentJobId}
                    onComplete={handleJobComplete}
                    onError={handleJobError}
                />
            )}

            {generating && !currentJobId && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
                    <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
                    <h2 className="text-xl font-bold">Iniciando Content Wizard...</h2>
                </div>
            )}
        </div>
    )
}
