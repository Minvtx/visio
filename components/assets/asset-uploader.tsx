'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Upload,
    X,
    Image as ImageIcon,
    FileText,
    Video,
    Loader2,
    Check,
    Trash2,
    Download
} from 'lucide-react'

interface Asset {
    id: string
    filename: string
    url: string
    mimeType: string
    sizeBytes: number
    tags: string[]
    uploadedAt: string
}

interface AssetUploaderProps {
    clientId: string
    assets: Asset[]
    onUploadComplete: () => void
    onDelete?: (assetId: string) => void
}

const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return ImageIcon
    if (mimeType.startsWith('video/')) return Video
    return FileText
}

export function AssetUploader({ clientId, assets, onUploadComplete, onDelete }: AssetUploaderProps) {
    const [isDragging, setIsDragging] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState<string | null>(null)
    const [tags, setTags] = useState('')

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(true)
    }, [])

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
    }, [])

    const uploadFile = async (file: File) => {
        setUploading(true)
        setUploadProgress(file.name)

        try {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('clientId', clientId)
            if (tags) formData.append('tags', tags)

            const res = await fetch('/api/assets', {
                method: 'POST',
                body: formData,
            })

            if (!res.ok) throw new Error('Upload failed')

            onUploadComplete()
            setTags('')
        } catch (err) {
            console.error('Upload error:', err)
        } finally {
            setUploading(false)
            setUploadProgress(null)
        }
    }

    const handleDrop = useCallback(async (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)

        const files = Array.from(e.dataTransfer.files)
        for (const file of files) {
            await uploadFile(file)
        }
    }, [clientId, tags])

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || [])
        for (const file of files) {
            await uploadFile(file)
        }
        e.target.value = ''
    }

    const handleDelete = async (assetId: string) => {
        if (!confirm('¿Eliminar este archivo?')) return

        try {
            const res = await fetch(`/api/assets?id=${assetId}`, {
                method: 'DELETE',
            })
            if (res.ok && onDelete) {
                onDelete(assetId)
            }
        } catch (err) {
            console.error('Delete error:', err)
        }
    }

    return (
        <div className="space-y-6">
            {/* Upload Zone */}
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all ${isDragging
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50 hover:bg-secondary/50'
                    }`}
            >
                {uploading ? (
                    <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-10 h-10 text-primary animate-spin" />
                        <p className="text-sm text-muted-foreground">
                            Subiendo {uploadProgress}...
                        </p>
                    </div>
                ) : (
                    <>
                        <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                        <p className="text-sm font-medium mb-1">
                            Arrastra archivos aquí o haz click para seleccionar
                        </p>
                        <p className="text-xs text-muted-foreground mb-4">
                            PNG, JPG, GIF, MP4, PDF hasta 10MB
                        </p>
                        <input
                            type="file"
                            multiple
                            accept="image/*,video/*,.pdf"
                            onChange={handleFileSelect}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                    </>
                )}
            </div>

            {/* Tags Input */}
            <div className="flex gap-2">
                <Input
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="Tags para el próximo archivo (separados por coma)"
                    className="flex-1"
                />
            </div>

            {/* Assets Grid */}
            {assets.length > 0 && (
                <div className="space-y-3">
                    <h4 className="text-sm font-medium text-muted-foreground">
                        Archivos ({assets.length})
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {assets.map((asset) => {
                            const FileIcon = getFileIcon(asset.mimeType)
                            const isImage = asset.mimeType.startsWith('image/')

                            return (
                                <Card key={asset.id} className="group relative overflow-hidden">
                                    {isImage ? (
                                        <div className="aspect-square bg-secondary">
                                            <img
                                                src={asset.url}
                                                alt={asset.filename}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    ) : (
                                        <div className="aspect-square bg-secondary flex items-center justify-center">
                                            <FileIcon className="w-12 h-12 text-muted-foreground" />
                                        </div>
                                    )}

                                    {/* Overlay */}
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                        <a
                                            href={asset.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
                                        >
                                            <Download className="w-4 h-4 text-white" />
                                        </a>
                                        <button
                                            onClick={() => handleDelete(asset.id)}
                                            className="p-2 rounded-lg bg-red-500/80 hover:bg-red-500 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4 text-white" />
                                        </button>
                                    </div>

                                    {/* Info */}
                                    <CardContent className="p-2">
                                        <p className="text-xs font-medium truncate">{asset.filename}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {formatFileSize(asset.sizeBytes)}
                                        </p>
                                        {asset.tags.length > 0 && (
                                            <div className="flex gap-1 mt-1 flex-wrap">
                                                {asset.tags.slice(0, 2).map((tag) => (
                                                    <span
                                                        key={tag}
                                                        className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded"
                                                    >
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                </div>
            )}

            {assets.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                    <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No hay archivos subidos</p>
                </div>
            )}
        </div>
    )
}
