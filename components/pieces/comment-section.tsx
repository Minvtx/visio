'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { MessageSquare, Send, Check, Trash2, Loader2, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useToast } from '@/components/ui/use-toast'
import { Badge } from '@/components/ui/badge'

interface Comment {
    id: string
    content: string
    status: 'OPEN' | 'RESOLVED' | 'IGNORED'
    createdAt: string
    user: {
        id: string
        name: string | null
    }
}

interface CommentSectionProps {
    pieceId: string
    currentUser: { id: string; name: string | null }
}

export function CommentSection({ pieceId, currentUser }: CommentSectionProps) {
    const { toast } = useToast()
    const [comments, setComments] = useState<Comment[]>([])
    const [loading, setLoading] = useState(true)
    const [newComment, setNewComment] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [actionLoading, setActionLoading] = useState<string | null>(null)

    useEffect(() => {
        fetchComments()
    }, [pieceId])

    const fetchComments = async () => {
        try {
            const res = await fetch(`/api/pieces/${pieceId}/comments`)
            if (res.ok) {
                const data = await res.json()
                setComments(data)
            }
        } catch (error) {
            console.error('Error fetching comments:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async () => {
        if (!newComment.trim()) return
        setSubmitting(true)
        try {
            const res = await fetch(`/api/pieces/${pieceId}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: newComment }),
            })
            if (!res.ok) throw new Error('Error posting comment')

            const savedComment = await res.json()
            setComments([savedComment, ...comments])
            setNewComment('')
        } catch (err) {
            toast({
                title: "Error",
                description: "No se pudo enviar el comentario.",
                variant: 'destructive'
            })
        } finally {
            setSubmitting(false)
        }
    }

    const handleResolve = async (commentId: string) => {
        setActionLoading(commentId)
        try {
            const res = await fetch(`/api/comments/${commentId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'RESOLVED' }),
            })
            if (res.ok) {
                setComments(comments.map(c => c.id === commentId ? { ...c, status: 'RESOLVED' } : c))
            }
        } catch (err) {
            console.error(err)
        } finally {
            setActionLoading(null)
        }
    }

    const handleDelete = async (commentId: string) => {
        if (!confirm('¿Eliminar comentario?')) return
        setActionLoading(commentId)
        try {
            const res = await fetch(`/api/comments/${commentId}`, {
                method: 'DELETE',
            })
            if (res.ok) {
                setComments(comments.filter(c => c.id !== commentId))
            }
        } catch (err) {
            console.error(err)
        } finally {
            setActionLoading(null)
        }
    }

    return (
        <div className="flex flex-col h-full max-h-[600px]">
            {/* Input Area */}
            <div className="p-4 border-b bg-card">
                <div className="relative">
                    <Textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Escribe un comentario..."
                        className="min-h-[80px] w-full resize-none pr-12"
                    />
                    <Button
                        size="icon"
                        className="absolute bottom-2 right-2 h-8 w-8"
                        onClick={handleSubmit}
                        disabled={submitting || !newComment.trim()}
                    >
                        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </Button>
                </div>
            </div>

            {/* List */}
            <ScrollArea className="flex-1 p-4">
                {loading ? (
                    <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
                ) : comments.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground">
                        <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-20" />
                        <p>No hay comentarios aún.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {comments.map((comment) => (
                            <div key={comment.id} className={`flex gap-3 group ${comment.status === 'RESOLVED' ? 'opacity-60' : ''}`}>
                                <Avatar className="w-8 h-8 mt-1">
                                    <AvatarImage src="" />
                                    <AvatarFallback>{comment.user.name?.[0] || 'U'}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 space-y-1">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-sm">{comment.user.name}</span>
                                            <span className="text-xs text-muted-foreground">
                                                {format(new Date(comment.createdAt), "d MMM, HH:mm", { locale: es })}
                                            </span>
                                        </div>
                                        {comment.status === 'RESOLVED' && (
                                            <Badge variant="success" className="text-[10px] h-5 px-1">
                                                Resuelto
                                            </Badge>
                                        )}
                                    </div>

                                    <div className="bg-secondary/50 p-3 rounded-lg text-sm whitespace-pre-wrap">
                                        {comment.content}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {comment.status === 'OPEN' && (
                                            <button
                                                onClick={() => handleResolve(comment.id)}
                                                disabled={!!actionLoading}
                                                className="text-xs text-muted-foreground hover:text-green-600 flex items-center gap-1"
                                            >
                                                <Check className="w-3 h-3" /> Resolver
                                            </button>
                                        )}
                                        {(currentUser.id === comment.user.id) && (
                                            <button
                                                onClick={() => handleDelete(comment.id)}
                                                disabled={!!actionLoading}
                                                className="text-xs text-muted-foreground hover:text-red-500 flex items-center gap-1"
                                            >
                                                <Trash2 className="w-3 h-3" /> Eliminar
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </ScrollArea>
        </div>
    )
}
