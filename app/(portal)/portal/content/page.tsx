'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/badge'
import {
    CheckCircle,
    X,
    Loader2,
    Copy,
    Check,
    MessageSquare,
    ArrowLeft,
    ChevronLeft,
    ChevronRight,
    Eye
} from 'lucide-react'
import Link from 'next/link'

interface ContentPiece {
    id: string
    title: string
    format: string
    pillar: string
    copyShort: string
    status: string
    scheduledDate: string
    feedback?: string
}

interface ContentData {
    hasContent: boolean
    month?: {
        id: string
        name: string
    }
    stats?: {
        total: number
        approved: number
        pending: number
        progress: number
    }
    pieces?: ContentPiece[]
}

const formatIcons: Record<string, string> = {
    POST: '📷',
    CAROUSEL: '🎠',
    REEL: '🎬',
    STORY: '📱',
    THREAD: '🧵',
}

export default function PortalContent() {
    const [data, setData] = useState<ContentData | null>(null)
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('all')
    const [actionLoading, setActionLoading] = useState<string | null>(null)
    const [selectedPiece, setSelectedPiece] = useState<ContentPiece | null>(null)
    const [showFeedbackModal, setShowFeedbackModal] = useState(false)
    const [feedbackText, setFeedbackText] = useState('')
    const [copied, setCopied] = useState(false)

    const fetchContent = async () => {
        try {
            const res = await fetch('/api/portal/content')
            if (!res.ok) throw new Error('Error')
            const result = await res.json()
            setData(result)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchContent()
    }, [])

    const handleApprove = async (pieceId: string) => {
        setActionLoading(pieceId)
        try {
            const res = await fetch(`/api/portal/pieces/${pieceId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'approve' }),
            })
            if (res.ok) {
                await fetchContent() // Refresh data
            }
        } catch (err) {
            console.error(err)
        } finally {
            setActionLoading(null)
        }
    }

    const handleFeedback = async () => {
        if (!selectedPiece) return
        setActionLoading(selectedPiece.id)
        try {
            const res = await fetch(`/api/portal/pieces/${selectedPiece.id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'feedback', feedback: feedbackText }),
            })
            if (res.ok) {
                await fetchContent()
                setShowFeedbackModal(false)
                setFeedbackText('')
                setSelectedPiece(null)
            }
        } catch (err) {
            console.error(err)
        } finally {
            setActionLoading(null)
        }
    }

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Cargando contenido...</p>
            </div>
        )
    }

    if (!data?.hasContent || !data.pieces) {
        return (
            <div className="text-center py-20">
                <p className="text-muted-foreground text-lg">No hay contenido disponible</p>
                <Link href="/portal">
                    <Button variant="outline" className="mt-4">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Volver
                    </Button>
                </Link>
            </div>
        )
    }

    const filteredPieces = data.pieces.filter((piece) => {
        if (filter === 'pending') return piece.status !== 'APPROVED'
        if (filter === 'approved') return piece.status === 'APPROVED'
        return true
    })

    const pendingCount = data.pieces.filter(p => p.status !== 'APPROVED').length
    const approvedCount = data.pieces.filter(p => p.status === 'APPROVED').length

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center mb-8">
                <Link href="/portal" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Volver al inicio
                </Link>
                <h1 className="text-3xl font-bold mb-2">Tu Contenido</h1>
                <p className="text-muted-foreground">
                    {data.month?.name} • {data.stats?.total} piezas
                </p>
            </div>

            {/* Progress Bar */}
            <Card className="p-4">
                <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Progreso</span>
                    <span className="font-semibold text-primary">{data.stats?.progress}% aprobado</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                        className="h-full gradient-primary rounded-full transition-all duration-500"
                        style={{ width: `${data.stats?.progress || 0}%` }}
                    />
                </div>
            </Card>

            {/* Filter Tabs - BIG and CLEAR */}
            <div className="flex gap-2 justify-center">
                <FilterButton
                    active={filter === 'all'}
                    onClick={() => setFilter('all')}
                    count={data.pieces.length}
                >
                    Todos
                </FilterButton>
                <FilterButton
                    active={filter === 'pending'}
                    onClick={() => setFilter('pending')}
                    count={pendingCount}
                    variant="warning"
                >
                    Pendientes
                </FilterButton>
                <FilterButton
                    active={filter === 'approved'}
                    onClick={() => setFilter('approved')}
                    count={approvedCount}
                    variant="success"
                >
                    Aprobados
                </FilterButton>
            </div>

            {/* Content Grid */}
            <div className="grid sm:grid-cols-2 gap-4">
                {filteredPieces.map((piece) => (
                    <ContentCard
                        key={piece.id}
                        piece={piece}
                        onApprove={() => handleApprove(piece.id)}
                        onFeedback={() => {
                            setSelectedPiece(piece)
                            setShowFeedbackModal(true)
                        }}
                        onCopy={() => handleCopy(piece.copyShort)}
                        isLoading={actionLoading === piece.id}
                        copied={copied}
                    />
                ))}
            </div>

            {filteredPieces.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-muted-foreground text-lg">No hay contenido en esta categoría</p>
                </div>
            )}

            {/* Feedback Modal */}
            {showFeedbackModal && selectedPiece && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <Card className="w-full max-w-md">
                        <CardContent className="p-6 space-y-4">
                            <h3 className="text-lg font-semibold">Enviar Feedback</h3>
                            <p className="text-sm text-muted-foreground">
                                Cuéntanos qué cambios necesitas en esta pieza:
                            </p>
                            <p className="text-sm font-medium bg-secondary p-2 rounded">
                                {selectedPiece.title}
                            </p>
                            <textarea
                                value={feedbackText}
                                onChange={(e) => setFeedbackText(e.target.value)}
                                placeholder="Ej: Me gustaría que el tono sea más formal..."
                                className="w-full min-h-[120px] bg-secondary rounded-lg p-3 text-base resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => {
                                        setShowFeedbackModal(false)
                                        setFeedbackText('')
                                        setSelectedPiece(null)
                                    }}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    className="flex-1"
                                    onClick={handleFeedback}
                                    disabled={!feedbackText.trim() || actionLoading !== null}
                                >
                                    {actionLoading === selectedPiece.id ? (
                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                    ) : null}
                                    Enviar
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    )
}

function FilterButton({
    active,
    onClick,
    count,
    variant = 'default',
    children
}: {
    active: boolean
    onClick: () => void
    count: number
    variant?: 'default' | 'warning' | 'success'
    children: React.ReactNode
}) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium transition-all ${active
                ? 'bg-primary text-white'
                : 'bg-secondary text-muted-foreground hover:text-foreground'
                }`}
        >
            {children}
            <span className={`px-2 py-0.5 rounded-full text-xs ${active ? 'bg-white/20' : 'bg-background'
                }`}>
                {count}
            </span>
        </button>
    )
}

function ContentCard({
    piece,
    onApprove,
    onFeedback,
    onCopy,
    isLoading,
    copied
}: {
    piece: ContentPiece
    onApprove: () => void
    onFeedback: () => void
    onCopy: () => void
    isLoading: boolean
    copied: boolean
}) {
    const isPending = piece.status !== 'APPROVED'

    return (
        <Card className={`overflow-hidden transition-all hover:border-primary/50 ${isPending ? 'border-amber-500/30' : 'border-emerald-500/30'
            }`}>
            <CardContent className="p-5">
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">{formatIcons[piece.format] || '📝'}</span>
                        <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded">
                            {piece.pillar}
                        </span>
                    </div>
                    <StatusBadge status={piece.status} />
                </div>

                {/* Title */}
                <h3 className="font-semibold text-lg mb-3 line-clamp-2">{piece.title}</h3>

                {/* Copy Preview */}
                <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
                    {piece.copyShort}
                </p>

                {/* Date */}
                <div className="text-xs text-muted-foreground mb-4">
                    📅 Programado: {piece.scheduledDate ? new Date(piece.scheduledDate).toLocaleDateString('es-AR', {
                        day: 'numeric',
                        month: 'short'
                    }) : 'Sin fecha'}
                </div>

                {/* Feedback notice */}
                {piece.feedback && (
                    <div className="text-xs text-amber-500 bg-amber-500/10 p-2 rounded mb-4">
                        💬 {piece.feedback}
                    </div>
                )}

                {/* Actions - BIG BUTTONS for easy touch */}
                {isPending ? (
                    <div className="flex gap-2">
                        <Button
                            className="flex-1"
                            size="lg"
                            onClick={onApprove}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <CheckCircle className="w-5 h-5 mr-2" />
                                    Aprobar
                                </>
                            )}
                        </Button>
                        <Button
                            variant="outline"
                            size="lg"
                            className="flex-1"
                            onClick={onFeedback}
                            disabled={isLoading}
                        >
                            <MessageSquare className="w-5 h-5 mr-2" />
                            Feedback
                        </Button>
                    </div>
                ) : (
                    <div className="flex gap-2">
                        <Link href={`/portal/content/${piece.id}`} className="flex-1">
                            <Button
                                variant="secondary"
                                className="w-full"
                            >
                                <Eye className="w-4 h-4 mr-2" />
                                Ver y Copiar
                            </Button>
                        </Link>
                    </div>
                )}

                {/* Link to detail - always show */}
                <Link href={`/portal/content/${piece.id}`} className="block mt-3">
                    <Button variant="ghost" size="sm" className="w-full text-muted-foreground hover:text-foreground">
                        Ver contenido completo →
                    </Button>
                </Link>
            </CardContent>
        </Card>
    )
}
