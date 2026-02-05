'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/badge'
import {
    ArrowLeft,
    Copy,
    Check,
    CheckCircle,
    MessageSquare,
    Loader2,
    Calendar,
    Hash,
    Image as ImageIcon,
    X
} from 'lucide-react'
import Link from 'next/link'

const formatEmojis: Record<string, string> = {
    POST: '📷',
    CAROUSEL: '🎠',
    REEL: '🎬',
    STORY: '📱',
}

interface PieceDetail {
    id: string
    title: string
    format: string
    pillar: string
    copy: {
        captionLong?: string
        captionShort?: string
        hooks?: Array<{ text: string; style: string }>
        ctas?: string[]
    }
    hashtags: string[]
    visualBrief: string
    status: string
    scheduledDate: string
    feedback?: string
    metadata?: any
}

export default function PortalPieceDetail() {
    const params = useParams()
    const router = useRouter()
    const pieceId = params.id as string

    const [piece, setPiece] = useState<PieceDetail | null>(null)
    const [loading, setLoading] = useState(true)
    const [copied, setCopied] = useState<string | null>(null)
    const [actionLoading, setActionLoading] = useState(false)
    const [showFeedbackModal, setShowFeedbackModal] = useState(false)
    const [feedbackText, setFeedbackText] = useState('')

    useEffect(() => {
        const fetchPiece = async () => {
            try {
                const res = await fetch(`/api/portal/pieces/${pieceId}`)
                if (!res.ok) throw new Error('Error')
                const data = await res.json()
                setPiece(data)
            } catch (err) {
                console.error(err)
            } finally {
                setLoading(false)
            }
        }
        fetchPiece()
    }, [pieceId])

    const handleCopy = async (text: string, type: string) => {
        try {
            await navigator.clipboard.writeText(text)
            setCopied(type)
            setTimeout(() => setCopied(null), 2000)
        } catch (err) {
            console.error('Failed to copy:', err)
        }
    }

    const handleApprove = async () => {
        setActionLoading(true)
        try {
            const res = await fetch(`/api/portal/pieces/${pieceId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'approve' }),
            })
            if (res.ok) {
                const data = await res.json()
                setPiece(prev => prev ? { ...prev, status: 'APPROVED', feedback: undefined } : null)
            }
        } catch (err) {
            console.error(err)
        } finally {
            setActionLoading(false)
        }
    }

    const handleFeedback = async () => {
        if (!feedbackText.trim()) return
        setActionLoading(true)
        try {
            const res = await fetch(`/api/portal/pieces/${pieceId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'feedback', feedback: feedbackText }),
            })
            if (res.ok) {
                setPiece(prev => prev ? { ...prev, status: 'PENDING_REVIEW', feedback: feedbackText } : null)
                setShowFeedbackModal(false)
                setFeedbackText('')
            }
        } catch (err) {
            console.error(err)
        } finally {
            setActionLoading(false)
        }
    }

    const getCaptionLong = () => {
        if (!piece) return ''
        if (typeof piece.copy === 'string') return piece.copy
        return piece.copy?.captionLong || ''
    }

    const getHashtagsFormatted = () => {
        if (!piece?.hashtags) return ''
        return piece.hashtags.map(h => h.startsWith('#') ? h : `#${h}`).join(' ')
    }

    const getFullCopy = () => {
        const caption = getCaptionLong()
        const hashtags = getHashtagsFormatted()
        if (!hashtags) return caption
        return `${caption}\n\n.\n.\n.\n\n${hashtags}`
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    if (!piece) {
        return (
            <div className="text-center py-12">
                <p className="text-muted-foreground">No se encontró la pieza</p>
                <Link href="/portal/content">
                    <Button variant="outline" className="mt-4">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Volver
                    </Button>
                </Link>
            </div>
        )
    }

    const isPending = piece.status !== 'APPROVED'

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <Link href="/portal/content">
                    <Button variant="ghost" size="sm" className="gap-2">
                        <ArrowLeft className="w-4 h-4" />
                        Volver al contenido
                    </Button>
                </Link>
                <StatusBadge status={piece.status} />
            </div>

            {/* Title */}
            <div className="flex items-center gap-3">
                <span className="text-4xl">{formatEmojis[piece.format] || '📝'}</span>
                <div>
                    <h1 className="text-2xl font-bold">{piece.title}</h1>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <span>{piece.pillar}</span>
                        {piece.scheduledDate && (
                            <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {new Date(piece.scheduledDate).toLocaleDateString('es-AR', {
                                    day: 'numeric',
                                    month: 'long'
                                })}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Feedback Alert */}
            {piece.feedback && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                    <p className="text-amber-600 dark:text-amber-400 font-medium mb-1">💬 Tu feedback anterior:</p>
                    <p className="text-sm">{piece.feedback}</p>
                </div>
            )}

            {/* COPY LISTO PARA PUBLICAR - Main Feature */}
            <Card className="border-2 border-primary/50 bg-gradient-to-br from-primary/10 to-transparent">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-xl">
                            📋 Copy Listo para Publicar
                        </CardTitle>
                        <Button
                            size="lg"
                            onClick={() => handleCopy(getFullCopy(), 'full')}
                            className="gap-2 text-lg px-6"
                        >
                            {copied === 'full' ? (
                                <>
                                    <Check className="w-5 h-5" />
                                    ¡Copiado!
                                </>
                            ) : (
                                <>
                                    <Copy className="w-5 h-5" />
                                    Copiar Todo
                                </>
                            )}
                        </Button>
                    </div>
                    <p className="text-muted-foreground">
                        Copia todo el contenido listo para pegar directamente en Instagram
                    </p>
                </CardHeader>
                <CardContent>
                    {/* Preview estilo Instagram */}
                    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-border overflow-hidden max-w-md mx-auto">
                        {/* Instagram Header Mock */}
                        <div className="flex items-center gap-3 p-3 border-b border-border">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500" />
                            <div className="font-medium">Tu Marca</div>
                        </div>

                        {/* Image placeholder */}
                        <div className="aspect-square bg-secondary/50 flex items-center justify-center">
                            <div className="text-center text-muted-foreground">
                                <ImageIcon className="w-16 h-16 mx-auto mb-2 opacity-50" />
                                <p className="text-lg">{piece.format}</p>
                            </div>
                        </div>

                        {/* Caption Preview */}
                        <div className="p-4 space-y-4">
                            {/* Caption */}
                            <div className="text-sm whitespace-pre-wrap leading-relaxed">
                                {getCaptionLong() || <span className="text-muted-foreground italic">Sin caption...</span>}
                            </div>

                            {/* Separator and Hashtags */}
                            {piece.hashtags?.length > 0 && (
                                <>
                                    <div className="text-muted-foreground text-center text-xs">
                                        .<br />.<br />.
                                    </div>
                                    <div className="text-sm text-primary/80 break-words">
                                        {getHashtagsFormatted()}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="mt-6 flex items-center justify-center gap-6 text-sm text-muted-foreground">
                        <span>📝 {getCaptionLong().length} caracteres</span>
                        <span># {piece.hashtags?.length || 0} hashtags</span>
                        <span>📊 {getCaptionLong().split(/\s+/).filter(Boolean).length} palabras</span>
                    </div>
                </CardContent>
            </Card>

            {/* Copy Individual Sections */}
            <div className="grid md:grid-cols-2 gap-4">
                {/* Solo Caption */}
                <Card>
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base">Solo Caption</CardTitle>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCopy(getCaptionLong(), 'caption')}
                            >
                                {copied === 'caption' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground line-clamp-4">
                            {getCaptionLong().substring(0, 200)}...
                        </p>
                    </CardContent>
                </Card>

                {/* Solo Hashtags */}
                <Card>
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Hash className="w-4 h-4" />
                                Solo Hashtags
                            </CardTitle>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCopy(getHashtagsFormatted(), 'hashtags')}
                            >
                                {copied === 'hashtags' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-1">
                            {piece.hashtags?.slice(0, 8).map((tag, i) => (
                                <span key={i} className="text-xs bg-secondary px-2 py-1 rounded">
                                    {tag.startsWith('#') ? tag : `#${tag}`}
                                </span>
                            ))}
                            {piece.hashtags?.length > 8 && (
                                <span className="text-xs text-muted-foreground">+{piece.hashtags.length - 8} más</span>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Actions */}
            {isPending ? (
                <div className="flex gap-4">
                    <Button
                        size="lg"
                        className="flex-1 h-14 text-lg"
                        onClick={handleApprove}
                        disabled={actionLoading}
                    >
                        {actionLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                <CheckCircle className="w-6 h-6 mr-2" />
                                Aprobar este contenido
                            </>
                        )}
                    </Button>
                    <Button
                        variant="outline"
                        size="lg"
                        className="flex-1 h-14 text-lg"
                        onClick={() => setShowFeedbackModal(true)}
                        disabled={actionLoading}
                    >
                        <MessageSquare className="w-6 h-6 mr-2" />
                        Solicitar cambios
                    </Button>
                </div>
            ) : (
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-6 text-center">
                    <CheckCircle className="w-12 h-12 mx-auto mb-2 text-emerald-500" />
                    <p className="text-emerald-600 dark:text-emerald-400 font-medium text-lg">
                        ¡Este contenido está aprobado!
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                        Ya puedes copiarlo y publicarlo en tus redes
                    </p>
                </div>
            )}

            {/* Feedback Modal */}
            {showFeedbackModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <Card className="w-full max-w-md">
                        <CardContent className="p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold">Solicitar Cambios</h3>
                                <button onClick={() => setShowFeedbackModal(false)}>
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Cuéntanos qué cambios necesitas en esta pieza:
                            </p>
                            <textarea
                                value={feedbackText}
                                onChange={(e) => setFeedbackText(e.target.value)}
                                placeholder="Ej: Me gustaría un tono más informal..."
                                className="w-full min-h-[120px] p-3 bg-secondary rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => setShowFeedbackModal(false)}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    className="flex-1"
                                    onClick={handleFeedback}
                                    disabled={!feedbackText.trim() || actionLoading}
                                >
                                    {actionLoading ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        'Enviar Feedback'
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    )
}
