'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { StatusBadge } from '@/components/ui/badge'
import { CarouselViewer } from '@/components/pieces/carousel-viewer'
import { useSession } from 'next-auth/react'
import { CommentSection } from '@/components/pieces/comment-section'
import { VersionHistory } from '@/components/pieces/version-history'
import {
    ArrowLeft,
    Sparkles,
    Copy,
    RefreshCw,
    Check,
    X,
    Calendar,
    Image as ImageIcon,
    Hash,
    MessageSquare,
    History,
    Wand2,
    Loader2,
    Save,
    AlertCircle,
    ShieldCheck,
    ShieldAlert,
    Activity,
} from 'lucide-react'
import Link from 'next/link'

const formatEmojis: Record<string, string> = {
    POST: '📷',
    CAROUSEL: '🎠',
    REEL: '🎬',
    STORY: '📱',
}

export default function PieceEditorPage() {
    const params = useParams()
    const router = useRouter()
    const { data: session } = useSession()
    const pieceId = params.id as string

    const [activeTab, setActiveTab] = useState<'copy' | 'visual' | 'comments' | 'history'>('copy')
    const [copied, setCopied] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [piece, setPiece] = useState<any>(null)
    const [error, setError] = useState('')

    // Editable fields
    const [title, setTitle] = useState('')
    const [captionLong, setCaptionLong] = useState('')
    const [visualBrief, setVisualBrief] = useState('')
    const [hashtags, setHashtags] = useState<string[]>([])

    // Action states
    const [saving, setSaving] = useState(false)
    const [approving, setApproving] = useState(false)
    const [rejecting, setRejecting] = useState(false)
    const [regenerating, setRegenerating] = useState<string | null>(null)
    const [showRejectDialog, setShowRejectDialog] = useState(false)
    const [rejectFeedback, setRejectFeedback] = useState('')
    const [hasChanges, setHasChanges] = useState(false)
    const [saveSuccess, setSaveSuccess] = useState(false)

    // QA & Audit
    const [qaStatus, setQaStatus] = useState<any>(null)
    const [runningQA, setRunningQA] = useState(false)

    // AI Regeneration results
    const [hookVariants, setHookVariants] = useState<any[] | null>(null)

    const fetchPiece = async () => {
        try {
            const res = await fetch(`/api/pieces/${pieceId}`)
            if (!res.ok) throw new Error('Error al cargar pieza')
            const data = await res.json()
            setPiece(data)

            // Initialize editable fields
            setTitle(data.title || '')
            setVisualBrief(data.visualBrief || '')
            setHashtags(data.hashtags || [])

            // Parse copy
            try {
                if (typeof data.copy === 'string') {
                    const parsed = JSON.parse(data.copy)
                    setCaptionLong(parsed.captionLong || data.copy)
                } else if (typeof data.copy === 'object' && data.copy !== null) {
                    setCaptionLong(data.copy.captionLong || '')
                } else {
                    setCaptionLong(String(data.copy || ''))
                }
            } catch {
                setCaptionLong(String(data.copy || ''))
            }
        } catch (err) {
            console.error(err)
            setError('No se pudo cargar la pieza')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchPiece()
        fetchQA()
    }, [pieceId])

    const fetchQA = async () => {
        try {
            const res = await fetch(`/api/pieces/${pieceId}/qa`)
            if (res.ok) {
                const data = await res.json()
                if (data && data.length > 0) {
                    setQaStatus(data[0])
                }
            }
        } catch (e) { console.error(e) }
    }

    // Track changes
    useEffect(() => {
        if (!piece) return
        const originalCopy = typeof piece.copy === 'object' ? piece.copy?.captionLong : piece.copy
        const changed = title !== piece.title ||
            captionLong !== (originalCopy || '') ||
            visualBrief !== (piece.visualBrief || '') ||
            JSON.stringify(hashtags) !== JSON.stringify(piece.hashtags || [])
        setHasChanges(changed)
    }, [title, captionLong, visualBrief, hashtags, piece])

    const handleCopy = (text: string, field: string) => {
        navigator.clipboard.writeText(text)
        setCopied(field)
        setTimeout(() => setCopied(null), 2000)
    }

    const handleSave = async () => {
        setSaving(true)
        setSaveSuccess(false)
        try {
            const res = await fetch(`/api/pieces/${pieceId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    copy: { captionLong },
                    visualBrief,
                    hashtags,
                }),
            })
            if (!res.ok) throw new Error('Error al guardar')
            const updated = await res.json()
            setPiece(updated)
            setHasChanges(false)
            setSaveSuccess(true)
            setTimeout(() => setSaveSuccess(false), 2000)
        } catch (err) {
            console.error(err)
            setError('Error al guardar cambios')
        } finally {
            setSaving(false)
        }
    }

    const handleApprove = async () => {
        setApproving(true)
        try {
            const res = await fetch(`/api/pieces/${pieceId}/approve`, {
                method: 'POST',
            })
            if (!res.ok) throw new Error('Error al aprobar')
            const updated = await res.json()
            setPiece({ ...piece, ...updated })
        } catch (err) {
            console.error(err)
            setError('Error al aprobar pieza')
        } finally {
            setApproving(false)
        }
    }

    const handleReject = async () => {
        setRejecting(true)
        try {
            const res = await fetch(`/api/pieces/${pieceId}/reject`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ feedback: rejectFeedback }),
            })
            if (!res.ok) throw new Error('Error al rechazar')
            const updated = await res.json()
            setPiece({ ...piece, ...updated })
            setShowRejectDialog(false)
            setRejectFeedback('')
        } catch (err) {
            console.error(err)
            setError('Error al rechazar pieza')
        } finally {
            setRejecting(false)
        }
    }

    const handleRegenerate = async (target: 'hook' | 'copy' | 'hashtags' | 'visual' | 'humanize' | 'optimize') => {
        setRegenerating(target)
        setHookVariants(null)
        try {
            const res = await fetch(`/api/pieces/${pieceId}/regenerate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ target }),
            })
            if (!res.ok) throw new Error('Error al regenerar')
            const data = await res.json()

            // Apply result based on target
            switch (target) {
                case 'hook':
                    if (data.result.hooks) {
                        setHookVariants(data.result.hooks)
                    }
                    break
                case 'copy':
                    if (data.result.captionLong) {
                        setCaptionLong(data.result.captionLong)
                        setHasChanges(true)
                    }
                    break
                case 'hashtags':
                    if (data.result.hashtags) {
                        setHashtags(data.result.hashtags)
                        setHasChanges(true)
                    }
                    break
                case 'visual':
                    if (data.result.aiPrompt) {
                        setVisualBrief(data.result.aiPrompt)
                        setHasChanges(true)
                    }
                    break
                case 'humanize':
                case 'optimize':
                    if (data.result.captionLong) {
                        setCaptionLong(data.result.captionLong)
                        setHasChanges(true)
                    }
                    break
            }
        } catch (err) {
            console.error(err)
            setError(`Error al regenerar ${target}`)
        } finally {
            setRegenerating(null)
        }
    }

    const runQA = async () => {
        setRunningQA(true)
        try {
            // Save first if pending changes
            if (hasChanges) {
                await handleSave()
            }

            const res = await fetch(`/api/pieces/${pieceId}/qa`, { method: 'POST' })
            if (!res.ok) throw new Error('Error en QA')
            const result = await res.json()
            setQaStatus(result)
        } catch (e) {
            setError('Error ejecutando QA')
        } finally {
            setRunningQA(false)
        }
    }

    const selectHookVariant = (hook: { text: string }) => {
        setTitle(hook.text)
        setHookVariants(null)
        setHasChanges(true)
    }

    if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
    if (error && !piece) return <div className="text-center py-20 text-red-500">{error}</div>

    const monthData = piece.contentMonth
    const clientData = monthData.client
    const carouselSlides = piece.metadata?.carouselSlides || []

    return (
        <div className="min-h-screen">
            {/* Fixed Top Bar */}
            <div className="fixed top-16 left-64 right-0 z-20 h-14 bg-card/95 backdrop-blur border-b border-border px-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link
                        href={`/admin/clients/${clientData.id}/months/${monthData.id}`}
                        className="p-2 rounded-lg hover:bg-secondary transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </Link>
                    <div className="flex items-center gap-2">
                        <span className="text-xl">{formatEmojis[piece.type] || formatEmojis[piece.format]}</span>
                        <span className="font-medium">{title.slice(0, 40)}{title.length > 40 ? '...' : ''}</span>
                    </div>
                    <StatusBadge status={piece.status} />
                    {hasChanges && (
                        <span className="text-xs text-amber-500 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Sin guardar
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground mr-4">
                        {piece.suggestedDate && new Date(piece.suggestedDate).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric' })}
                    </span>

                    {/* Save Button */}
                    {hasChanges && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleSave}
                            disabled={saving}
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                            Guardar
                        </Button>
                    )}
                    {saveSuccess && (
                        <span className="text-sm text-emerald-500 flex items-center gap-1">
                            <Check className="w-4 h-4" />
                            Guardado
                        </span>
                    )}

                    {/* Reject Button */}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowRejectDialog(true)}
                        disabled={piece.status === 'APPROVED' || rejecting}
                    >
                        {rejecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4 mr-2" />}
                        Rechazar
                    </Button>

                    {/* Approve Button */}
                    <Button
                        size="sm"
                        onClick={handleApprove}
                        disabled={piece.status === 'APPROVED' || approving || hasChanges || (qaStatus && !qaStatus.passed && session?.user?.role !== 'ADMIN')}
                        className={qaStatus && !qaStatus.passed ? "opacity-50 cursor-not-allowed" : ""}
                        title={qaStatus && !qaStatus.passed ? "QA Failed" : "Aprobar"}
                    >
                        {approving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                        {piece.status === 'APPROVED' ? 'Aprobado ✓' : 'Aprobar'}
                    </Button>
                </div>
            </div>

            {/* Reject Dialog */}
            {showRejectDialog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <Card className="w-full max-w-md">
                        <CardHeader>
                            <CardTitle>Rechazar Pieza</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-muted-foreground">
                                Añade feedback para explicar qué cambios se necesitan.
                            </p>
                            <textarea
                                value={rejectFeedback}
                                onChange={(e) => setRejectFeedback(e.target.value)}
                                placeholder="Ej: El tono no es adecuado, necesita ser más formal..."
                                className="w-full min-h-[100px] bg-secondary rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                            <div className="flex gap-2 justify-end">
                                <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
                                    Cancelar
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={handleReject}
                                    disabled={rejecting}
                                >
                                    {rejecting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                    Rechazar
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Error Toast */}
            {error && piece && (
                <div className="fixed top-24 right-6 z-50 bg-red-500/90 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                    <button onClick={() => setError('')} className="ml-2">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Main Content */}
            <div className="pt-14 flex">
                {/* Editor Area */}
                <div className="flex-1 p-6 space-y-6 overflow-auto max-h-[calc(100vh-7.5rem)]">
                    {/* Title */}
                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-base">Título / Hook</CardTitle>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRegenerate('hook')}
                                    disabled={regenerating === 'hook'}
                                >
                                    {regenerating === 'hook' ? (
                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                    ) : (
                                        <Sparkles className="w-4 h-4 mr-2" />
                                    )}
                                    Regenerar
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="text-lg font-medium"
                            />

                            {/* Hook Variants */}
                            {hookVariants && hookVariants.length > 0 && (
                                <div className="mt-4 p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-2">
                                    <p className="text-sm font-medium text-primary">Variantes generadas:</p>
                                    {hookVariants.map((hook, i) => (
                                        <button
                                            key={i}
                                            onClick={() => selectHookVariant(hook)}
                                            className="block w-full text-left p-3 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
                                        >
                                            <span className="text-sm">{hook.text}</span>
                                            <span className="text-xs text-muted-foreground ml-2">({hook.style})</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Tab Navigation */}
                    <div className="flex gap-1 p-1 bg-secondary rounded-lg w-fit">
                        {[
                            { id: 'copy', label: 'Copy & Contenido', icon: MessageSquare },
                            { id: 'visual', label: 'Brief Visual', icon: ImageIcon },
                            { id: 'comments', label: 'Comentarios', icon: MessageSquare },
                            { id: 'history', label: 'Historial', icon: History },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm transition-colors ${activeTab === tab.id ? 'bg-background font-medium' : 'text-muted-foreground'
                                    }`}
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {activeTab === 'copy' && (
                        <div className="space-y-4">
                            {/* CAROUSEL VIEWER */}
                            {(piece.type === 'CAROUSEL' || piece.format === 'CAROUSEL') && carouselSlides.length > 0 && (
                                <CarouselViewer slides={carouselSlides} />
                            )}

                            {/* Copy Long (Caption) */}
                            <Card>
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-base">Caption / Copy del Post</CardTitle>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleCopy(captionLong, 'long')}
                                            >
                                                {copied === 'long' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleRegenerate('copy')}
                                                disabled={regenerating === 'copy'}
                                            >
                                                {regenerating === 'copy' ? (
                                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                                ) : (
                                                    <Wand2 className="w-4 h-4 mr-2" />
                                                )}
                                                Mejorar
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <textarea
                                        value={captionLong}
                                        onChange={(e) => setCaptionLong(e.target.value)}
                                        className="w-full min-h-[200px] bg-secondary rounded-lg p-4 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                                    />
                                </CardContent>
                            </Card>

                            {/* Hashtags */}
                            <Card>
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-base flex items-center gap-2">
                                            <Hash className="w-4 h-4" />
                                            Hashtags
                                        </CardTitle>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleCopy(hashtags.join(' '), 'hashtags')}
                                            >
                                                {copied === 'hashtags' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleRegenerate('hashtags')}
                                                disabled={regenerating === 'hashtags'}
                                            >
                                                {regenerating === 'hashtags' ? (
                                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                                ) : (
                                                    <RefreshCw className="w-4 h-4 mr-2" />
                                                )}
                                                Regenerar
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-wrap gap-2">
                                        {hashtags.map((tag, index) => (
                                            <span
                                                key={index}
                                                className="px-3 py-1.5 bg-secondary rounded-full text-sm group relative"
                                            >
                                                {tag.startsWith('#') ? tag : `#${tag}`}
                                                <button
                                                    onClick={() => setHashtags(hashtags.filter((_, i) => i !== index))}
                                                    className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    ×
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                    <Input
                                        placeholder="Añadir hashtag y presionar Enter"
                                        className="mt-3"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault()
                                                const input = e.currentTarget
                                                const value = input.value.trim()
                                                if (value && !hashtags.includes(value)) {
                                                    setHashtags([...hashtags, value.startsWith('#') ? value : `#${value}`])
                                                    input.value = ''
                                                }
                                            }
                                        }}
                                    />
                                </CardContent>
                            </Card>

                            {/* COPY LISTO PARA PUBLICAR */}
                            <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-base flex items-center gap-2">
                                            📋 Copy Listo para Publicar
                                        </CardTitle>
                                        <Button
                                            onClick={() => {
                                                const fullCopy = `${captionLong}\n\n.\n.\n.\n\n${hashtags.map(h => h.startsWith('#') ? h : `#${h}`).join(' ')}`
                                                handleCopy(fullCopy, 'full')
                                            }}
                                            className="gap-2"
                                        >
                                            {copied === 'full' ? (
                                                <>
                                                    <Check className="w-4 h-4" />
                                                    ¡Copiado!
                                                </>
                                            ) : (
                                                <>
                                                    <Copy className="w-4 h-4" />
                                                    Copiar Todo
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        Copia todo el contenido listo para pegar directamente en Instagram
                                    </p>
                                </CardHeader>
                                <CardContent>
                                    {/* Preview estilo Instagram */}
                                    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-border overflow-hidden">
                                        {/* Instagram Header Mock */}
                                        <div className="flex items-center gap-3 p-3 border-b border-border">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500" />
                                            <div className="text-sm font-medium text-foreground">
                                                {piece?.contentMonth?.client?.name || 'Tu Marca'}
                                            </div>
                                        </div>

                                        {/* Image placeholder */}
                                        <div className="aspect-square bg-secondary/50 flex items-center justify-center">
                                            <div className="text-center text-muted-foreground">
                                                <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                                <p className="text-sm">{piece?.type || 'POST'}</p>
                                            </div>
                                        </div>

                                        {/* Caption Preview */}
                                        <div className="p-4 space-y-3">
                                            {/* Caption */}
                                            <div className="text-sm whitespace-pre-wrap leading-relaxed">
                                                {captionLong || <span className="text-muted-foreground italic">Sin caption...</span>}
                                            </div>

                                            {/* Separador */}
                                            {hashtags.length > 0 && (
                                                <>
                                                    <div className="text-muted-foreground text-center">
                                                        .<br />.<br />.
                                                    </div>

                                                    {/* Hashtags */}
                                                    <div className="text-sm text-primary/80">
                                                        {hashtags.map(h => h.startsWith('#') ? h : `#${h}`).join(' ')}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Stats & QA Warning */}
                                    <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground justify-between">
                                        <div className="flex gap-4">
                                            <span>📝 {captionLong.length} caracteres</span>
                                            <span>#{hashtags.length} hashtags</span>
                                        </div>
                                        {qaStatus && !qaStatus.passed && (
                                            <span className="text-red-500 flex items-center gap-1">
                                                <ShieldAlert className="w-3 h-3" /> QA Failed
                                            </span>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {activeTab === 'visual' && (
                        <Card>
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-base">Prompt Visual (para imágenes IA)</CardTitle>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleCopy(visualBrief, 'visual')}
                                        >
                                            {copied === 'visual' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleRegenerate('visual')}
                                            disabled={regenerating === 'visual'}
                                        >
                                            {regenerating === 'visual' ? (
                                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                            ) : (
                                                <Sparkles className="w-4 h-4 mr-2" />
                                            )}
                                            Regenerar
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <textarea
                                    value={visualBrief}
                                    onChange={(e) => setVisualBrief(e.target.value)}
                                    className="w-full min-h-[150px] bg-secondary rounded-lg p-4 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                                />
                                <div className="mt-4 p-4 rounded-lg bg-primary/5 border border-primary/20">
                                    <p className="text-sm text-muted-foreground">
                                        💡 Este prompt describe visualmente lo que debería contener la pieza.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    )}


                    {activeTab === 'comments' && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <MessageSquare className="w-4 h-4" /> Comentarios
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {session?.user && (
                                    <CommentSection
                                        pieceId={pieceId}
                                        currentUser={{ id: session.user.id, name: session.user.name }}
                                    />
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {activeTab === 'history' && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <History className="w-4 h-4" /> Historial de Versiones
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <VersionHistory
                                    pieceId={pieceId}
                                    onRestore={() => {
                                        fetchPiece()
                                        // Trigger toast or something? component handles toast
                                    }}
                                />
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Right Inspector Panel */}
                <div className="w-80 border-l border-border p-4 space-y-4 overflow-auto max-h-[calc(100vh-7.5rem)]">
                    <h3 className="font-semibold">Propiedades</h3>

                    {/* Format */}
                    <div>
                        <label className="text-xs text-muted-foreground">Formato</label>
                        <div className="mt-1 flex items-center gap-2 p-2 rounded-lg bg-secondary">
                            <span className="text-xl">{formatEmojis[piece.type] || formatEmojis[piece.format]}</span>
                            <span className="font-medium">{piece.type || piece.format}</span>
                        </div>
                    </div>

                    {/* Pillar */}
                    <div>
                        <label className="text-xs text-muted-foreground">Pilar</label>
                        <div className="mt-1 p-2 rounded-lg bg-secondary font-medium">
                            {piece.pillar}
                        </div>
                    </div>

                    {/* Status */}
                    <div>
                        <label className="text-xs text-muted-foreground">Estado</label>
                        <div className="mt-1">
                            <StatusBadge status={piece.status} />
                        </div>
                    </div>

                    {/* Brand Health / QA Panel */}
                    <div className="p-3 bg-secondary/30 rounded-lg border border-border">
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-xs text-muted-foreground flex items-center gap-1 font-semibold">
                                <Activity className="w-3 h-3" /> Brand Health
                            </label>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={runQA} disabled={runningQA}>
                                {runningQA ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                            </Button>
                        </div>

                        {!qaStatus ? (
                            <div className="text-center py-4 bg-secondary/50 rounded-lg">
                                <ShieldCheck className="w-8 h-8 mx-auto text-muted-foreground/30 mb-2" />
                                <div className="text-xs text-muted-foreground">No evaluado aún</div>
                                <Button variant="ghost" size="sm" onClick={runQA} className="text-xs text-primary hover:text-primary/80">
                                    Ejecutar Auditoría
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {/* Score Ring */}
                                <div className="flex items-center gap-4">
                                    <div className={`relative w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm border-4 ${qaStatus.score >= 80 ? 'border-green-500 text-green-500' :
                                        qaStatus.score >= 50 ? 'border-amber-500 text-amber-500' :
                                            'border-red-500 text-red-500'
                                        }`}>
                                        {qaStatus.score}
                                    </div>
                                    <div>
                                        <div className={`text-sm font-medium ${qaStatus.passed ? "text-green-500" : "text-amber-500"
                                            }`}>
                                            {qaStatus.passed ? "ALINEADO" : "ATENCIÓN"}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            Score de Marca
                                        </div>
                                    </div>
                                </div>

                                {/* Detailed Feedback Tabs */}
                                {qaStatus.violations && (qaStatus.violations as string[]).length > 0 && (
                                    <div className="space-y-1">
                                        <div className="text-[10px] uppercase font-bold text-red-500 flex items-center gap-1">
                                            <ShieldAlert className="w-3 h-3" /> Violaciones ({qaStatus.violations.length})
                                        </div>
                                        <div className="bg-red-500/5 border border-red-500/20 p-2 rounded text-[10px] text-red-600 space-y-1 max-h-32 overflow-y-auto">
                                            {(qaStatus.violations as string[]).map((v, i) => (
                                                <div key={i} className="flex gap-1.5 items-start">
                                                    <span className="mt-0.5">•</span>
                                                    <span className="opacity-90">{v}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {qaStatus.suggestions && (qaStatus.suggestions as string[]).length > 0 && (
                                    <div className="space-y-1">
                                        <div className="text-[10px] uppercase font-bold text-blue-500 flex items-center gap-1">
                                            <Sparkles className="w-3 h-3" /> Sugerencias ({qaStatus.suggestions.length})
                                        </div>
                                        <div className="bg-blue-500/5 border border-blue-500/20 p-2 rounded text-[10px] text-blue-600 space-y-1 max-h-32 overflow-y-auto">
                                            {(qaStatus.suggestions as string[]).map((s, i) => (
                                                <div key={i} className="flex gap-1.5 items-start">
                                                    <span className="mt-0.5">•</span>
                                                    <span className="opacity-90">{s}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Feedback (if any) */}
                    {piece.feedback && (
                        <div>
                            <label className="text-xs text-muted-foreground">Feedback</label>
                            <div className="mt-1 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm">
                                {piece.feedback}
                            </div>
                        </div>
                    )}

                    {/* Scheduled Date */}
                    <div>
                        <label className="text-xs text-muted-foreground">Fecha Programada</label>
                        <div className="mt-1 flex items-center gap-2 p-2 rounded-lg bg-secondary">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span>{piece.suggestedDate && new Date(piece.suggestedDate).toLocaleDateString('es-AR', {
                                weekday: 'short',
                                day: 'numeric',
                                month: 'short'
                            })}</span>
                        </div>
                    </div>

                    <div className="border-t border-border pt-4 mt-4">
                        <h3 className="font-semibold mb-3">Acciones IA</h3>
                        <div className="space-y-2">
                            <Button
                                variant="outline"
                                className="w-full justify-start"
                                onClick={() => handleRegenerate('hook')}
                                disabled={regenerating !== null}
                            >
                                <Sparkles className="w-4 h-4 mr-2" />
                                Regenerar Hook
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full justify-start"
                                onClick={() => handleRegenerate('copy')}
                                disabled={regenerating !== null}
                            >
                                <Wand2 className="w-4 h-4 mr-2" />
                                Mejorar Copy
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full justify-start"
                                onClick={() => handleRegenerate('hashtags')}
                                disabled={regenerating !== null}
                            >
                                <Hash className="w-4 h-4 mr-2" />
                                Regenerar Hashtags
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full justify-start"
                                onClick={() => handleRegenerate('visual')}
                                disabled={regenerating !== null}
                            >
                                <ImageIcon className="w-4 h-4 mr-2" />
                                Nuevo Brief Visual
                            </Button>

                            <div className="pt-2 border-t border-border mt-2 space-y-2">
                                <p className="text-[10px] text-muted-foreground uppercase font-bold px-1">Refinamiento Avanzado</p>
                                <Button
                                    variant="outline"
                                    className="w-full justify-start text-blue-500 hover:text-blue-600 border-blue-200 hover:bg-blue-50"
                                    onClick={() => handleRegenerate('humanize')}
                                    disabled={regenerating !== null}
                                >
                                    <Activity className="w-4 h-4 mr-2" />
                                    Humanizar (Anti-IA)
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full justify-start text-emerald-500 hover:text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                                    onClick={() => handleRegenerate('optimize')}
                                    disabled={regenerating !== null}
                                >
                                    <Sparkles className="w-4 h-4 mr-2" />
                                    Optimizar Copy Pro
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-border pt-4 mt-4">
                        <h3 className="font-semibold mb-3">Cliente</h3>
                        <div className="text-sm">
                            <div className="font-medium">{clientData.name}</div>
                            <div className="text-muted-foreground">{monthData.month}-{monthData.year}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
