'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/badge'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'

interface Piece {
    id: string
    title: string
    type?: string
    format?: string
    pillar?: string
    status: string
    suggestedDate?: string
}

interface KanbanBoardProps {
    pieces: Piece[]
    onStatusChange?: (pieceId: string, newStatus: string) => Promise<void>
}

const COLUMNS = [
    { id: 'DRAFT', label: 'Borrador', color: 'bg-gray-500' },
    { id: 'PENDING_REVIEW', label: 'Pendiente Revisión', color: 'bg-amber-500' },
    { id: 'APPROVED', label: 'Aprobado', color: 'bg-emerald-500' },
]

const formatEmojis: Record<string, string> = {
    POST: '📷',
    CAROUSEL: '🎠',
    REEL: '🎬',
    STORY: '📱',
}

export function KanbanBoard({ pieces, onStatusChange }: KanbanBoardProps) {
    const [draggedPiece, setDraggedPiece] = useState<string | null>(null)
    const [dragOverColumn, setDragOverColumn] = useState<string | null>(null)
    const [updating, setUpdating] = useState<string | null>(null)

    const handleDragStart = (e: React.DragEvent, pieceId: string) => {
        setDraggedPiece(pieceId)
        e.dataTransfer.effectAllowed = 'move'
    }

    const handleDragOver = (e: React.DragEvent, columnId: string) => {
        e.preventDefault()
        setDragOverColumn(columnId)
    }

    const handleDragLeave = () => {
        setDragOverColumn(null)
    }

    const handleDrop = async (e: React.DragEvent, newStatus: string) => {
        e.preventDefault()
        setDragOverColumn(null)

        if (!draggedPiece || !onStatusChange) return

        const piece = pieces.find(p => p.id === draggedPiece)
        if (!piece || piece.status === newStatus) {
            setDraggedPiece(null)
            return
        }

        setUpdating(draggedPiece)
        try {
            await onStatusChange(draggedPiece, newStatus)
        } catch (error) {
            console.error('Error updating status:', error)
        } finally {
            setUpdating(null)
            setDraggedPiece(null)
        }
    }

    const getPiecesForColumn = (status: string) => {
        return pieces.filter(p => p.status === status)
    }

    return (
        <div className="grid grid-cols-3 gap-4 h-[calc(100vh-16rem)] overflow-hidden">
            {COLUMNS.map((column) => {
                const columnPieces = getPiecesForColumn(column.id)
                const isOver = dragOverColumn === column.id

                return (
                    <div
                        key={column.id}
                        className={`flex flex-col rounded-xl border transition-colors ${isOver
                            ? 'border-primary bg-primary/5'
                            : 'border-border bg-secondary/30'
                            }`}
                        onDragOver={(e) => handleDragOver(e, column.id)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, column.id)}
                    >
                        {/* Column Header */}
                        <div className="p-4 border-b border-border flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${column.color}`} />
                                <h3 className="font-semibold">{column.label}</h3>
                            </div>
                            <span className="text-sm text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                                {columnPieces.length}
                            </span>
                        </div>

                        {/* Column Content */}
                        <div className="flex-1 overflow-y-auto p-3 space-y-2">
                            {columnPieces.map((piece) => {
                                const isUpdating = updating === piece.id
                                const isDragging = draggedPiece === piece.id
                                const format = piece.type || piece.format || 'POST'

                                return (
                                    <div
                                        key={piece.id}
                                        draggable={!isUpdating}
                                        onDragStart={(e) => handleDragStart(e, piece.id)}
                                        className={`transition-all ${isDragging ? 'opacity-50' : ''
                                            } ${isUpdating ? 'pointer-events-none' : ''}`}
                                    >
                                        <Link href={`/admin/pieces/${piece.id}`}>
                                            <Card className={`cursor-grab active:cursor-grabbing hover:border-primary/50 transition-colors ${isUpdating ? 'opacity-50' : ''
                                                }`}>
                                                <CardContent className="p-3">
                                                    {/* Format & Pillar */}
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="text-lg">
                                                            {formatEmojis[format] || '📝'}
                                                        </span>
                                                        {piece.pillar && (
                                                            <span className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded">
                                                                {piece.pillar}
                                                            </span>
                                                        )}
                                                        {isUpdating && (
                                                            <Loader2 className="w-3 h-3 animate-spin ml-auto" />
                                                        )}
                                                    </div>

                                                    {/* Title */}
                                                    <h4 className="text-sm font-medium line-clamp-2 mb-2">
                                                        {piece.title}
                                                    </h4>

                                                    {/* Date */}
                                                    {piece.suggestedDate && (
                                                        <div className="text-[10px] text-muted-foreground">
                                                            📅 {new Date(piece.suggestedDate).toLocaleDateString('es-AR', {
                                                                day: 'numeric',
                                                                month: 'short'
                                                            })}
                                                        </div>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        </Link>
                                    </div>
                                )
                            })}

                            {columnPieces.length === 0 && (
                                <div className="text-center py-8 text-muted-foreground text-sm">
                                    Sin piezas
                                </div>
                            )}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
