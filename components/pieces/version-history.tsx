'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { History, RotateCcw, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useToast } from '@/components/ui/use-toast'

interface Version {
    id: string
    versionNumber: number
    createdAt: string
    changelog: string | null
    createdBy: string | null
}

interface VersionHistoryProps {
    pieceId: string
    onRestore: () => void
}

export function VersionHistory({ pieceId, onRestore }: VersionHistoryProps) {
    const { toast } = useToast()
    const [versions, setVersions] = useState<Version[]>([])
    const [loading, setLoading] = useState(true)
    const [restoring, setRestoring] = useState<string | null>(null)

    useEffect(() => {
        fetchVersions()
    }, [pieceId])

    const fetchVersions = async () => {
        try {
            const res = await fetch(`/api/pieces/${pieceId}/versions`)
            if (res.ok) {
                const data = await res.json()
                setVersions(data)
            }
        } catch (error) {
            console.error('Error fetching versions:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleRestore = async (versionId: string) => {
        setRestoring(versionId)
        try {
            const res = await fetch(`/api/pieces/${pieceId}/restore`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ versionId }),
            })

            if (!res.ok) throw new Error('Error al restaurar')

            toast({
                title: "Versión restaurada",
                description: "El contenido ha sido revertido exitosamente.",
                variant: "default"
            })

            onRestore() // Refund parent to refresh data
        } catch (error) {
            console.error(error)
            toast({
                title: "Error",
                description: "No se pudo restaurar la versión.",
                variant: "destructive"
            })
        } finally {
            setRestoring(null)
        }
    }

    if (loading) {
        return <div className="flex justify-center p-4"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
    }

    if (versions.length === 0) {
        return (
            <div className="text-center p-6 text-muted-foreground border rounded-lg bg-secondary/20">
                <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No hay versiones previas guardadas.</p>
            </div>
        )
    }

    return (
        <ScrollArea className="h-[400px] w-full rounded-md border p-4">
            <div className="space-y-4">
                {versions.map((version) => (
                    <div key={version.id} className="flex items-start justify-between p-3 rounded-lg border bg-card hover:bg-secondary/50 transition-colors">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <span className="font-semibold text-sm">Versión {version.versionNumber}</span>
                                <span className="text-xs text-muted-foreground">
                                    {format(new Date(version.createdAt), "d MMM yyyy, HH:mm", { locale: es })}
                                </span>
                            </div>
                            {version.changelog && (
                                <p className="text-sm text-muted-foreground">{version.changelog}</p>
                            )}
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRestore(version.id)}
                            disabled={!!restoring}
                        >
                            {restoring === version.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <RotateCcw className="w-4 h-4" />
                            )}
                        </Button>
                    </div>
                ))}
            </div>
        </ScrollArea>
    )
}
