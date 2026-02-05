
'use client'

import { useState, useEffect } from 'react'
import { Bell, MessageSquare, CheckCircle, XCircle, Info, Loader2, Check } from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import Link from 'next/link'

interface Notification {
    id: string
    title: string
    message: string
    type: string
    read: boolean
    createdAt: string
    resourceId?: string
    resourceType?: string
}

export function NotificationCenter() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [loading, setLoading] = useState(false)
    const [unreadCount, setUnreadCount] = useState(0)

    const fetchNotifications = async () => {
        try {
            const res = await fetch('/api/notifications')
            if (res.ok) {
                const data = await res.json()
                setNotifications(data)
                setUnreadCount(data.filter((n: Notification) => !n.read).length)
            }
        } catch (e) {
            console.error('Error fetching notifications', e)
        }
    }

    useEffect(() => {
        fetchNotifications()
        // Poll every 1 minute
        const interval = setInterval(fetchNotifications, 60000)
        return () => clearInterval(interval)
    }, [])

    const markAllAsRead = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/notifications', { method: 'PATCH', body: JSON.stringify({}) })
            if (res.ok) {
                setNotifications(notifications.map(n => ({ ...n, read: true })))
                setUnreadCount(0)
            }
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    const markAsRead = async (id: string) => {
        try {
            const res = await fetch('/api/notifications', {
                method: 'PATCH',
                body: JSON.stringify({ id })
            })
            if (res.ok) {
                setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n))
                setUnreadCount(prev => Math.max(0, prev - 1))
            }
        } catch (e) {
            console.error(e)
        }
    }

    const getIcon = (type: string) => {
        switch (type) {
            case 'COMMENT': return <MessageSquare className="w-4 h-4 text-blue-500" />
            case 'REVIEW_REQUEST': return <Info className="w-4 h-4 text-amber-500" />
            case 'APPROVED': return <CheckCircle className="w-4 h-4 text-emerald-500" />
            case 'REJECTED': return <XCircle className="w-4 h-4 text-red-500" />
            default: return <Bell className="w-4 h-4 text-muted-foreground" />
        }
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
                    {unreadCount > 0 && (
                        <span className="absolute top-2 right-2 flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 p-0 overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b">
                    <DropdownMenuLabel className="p-0 font-bold">Notificaciones</DropdownMenuLabel>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={markAllAsRead}
                            disabled={loading}
                            className="h-7 text-[11px] px-2 text-primary hover:text-primary/80"
                        >
                            {loading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Check className="w-3 h-3 mr-1" />}
                            Marcar todo como leído
                        </Button>
                    )}
                </div>

                <div className="max-h-[400px] overflow-y-auto">
                    {notifications.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">
                            <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                            <p className="text-sm">No tienes notificaciones</p>
                        </div>
                    ) : (
                        notifications.map((n) => (
                            <Link
                                key={n.id}
                                href={n.resourceType === 'ContentPiece' ? `/admin/pieces/${n.resourceId}` : '#'}
                                onClick={() => markAsRead(n.id)}
                            >
                                <DropdownMenuItem className={`flex items-start gap-3 p-4 border-b last:border-0 cursor-pointer transition-colors ${!n.read ? 'bg-primary/5' : ''}`}>
                                    <div className="mt-1">{getIcon(n.type)}</div>
                                    <div className="flex-1 space-y-1">
                                        <div className="flex justify-between items-center gap-2">
                                            <p className={`text-sm font-medium leading-none ${!n.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                                                {n.title}
                                            </p>
                                            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                                {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: es })}
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground line-clamp-2">
                                            {n.message}
                                        </p>
                                    </div>
                                    {!n.read && (
                                        <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                                    )}
                                </DropdownMenuItem>
                            </Link>
                        ))
                    )}
                </div>

                {notifications.length > 0 && (
                    <div className="p-2 border-t text-center">
                        <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground">
                            Ver todas las notificaciones
                        </Button>
                    </div>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
