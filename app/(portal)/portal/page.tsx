'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, CheckCircle, Clock, Download, ArrowRight, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface PortalData {
    hasContent: boolean
    message?: string
    month?: {
        id: string
        name: string
        month: number
        year: number
        status: string
    }
    client?: {
        name: string
        slug: string
    }
    stats?: {
        total: number
        approved: number
        pending: number
        progress: number
    }
}

// Portal Home - SUPER SIMPLE for clients
export default function PortalHome() {
    const [data, setData] = useState<PortalData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch('/api/portal/content')
                if (!res.ok) throw new Error('Error al cargar datos')
                const result = await res.json()
                setData(result)
            } catch (err) {
                console.error(err)
                setError('No se pudo cargar la información')
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Cargando tu contenido...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="text-center py-20">
                <p className="text-red-500 mb-4">{error}</p>
                <Button onClick={() => window.location.reload()}>Reintentar</Button>
            </div>
        )
    }

    if (!data?.hasContent) {
        return (
            <div className="space-y-8">
                <div className="text-center">
                    <h1 className="text-3xl font-bold mb-2">¡Hola! 👋</h1>
                    <p className="text-muted-foreground text-lg">
                        {data?.message || 'Tu contenido está siendo preparado'}
                    </p>
                </div>

                <Card className="glass border-primary/20 max-w-md mx-auto">
                    <CardContent className="p-8 text-center">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                            <Calendar className="w-8 h-8 text-primary" />
                        </div>
                        <h2 className="text-xl font-semibold mb-2">Contenido en Preparación</h2>
                        <p className="text-muted-foreground">
                            Te notificaremos cuando tu contenido esté listo para revisar.
                        </p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    const { month, stats, client } = data

    return (
        <div className="space-y-8">
            {/* Welcome */}
            <div className="text-center">
                <h1 className="text-3xl font-bold mb-2">¡Hola! 👋</h1>
                <p className="text-muted-foreground text-lg">
                    Tu contenido de <span className="text-primary font-semibold">{month?.name}</span> está listo para revisar
                </p>
                {client && (
                    <p className="text-sm text-muted-foreground mt-1">{client.name}</p>
                )}
            </div>

            {/* Progress Card - BIG and CLEAR */}
            <Card className="glass border-primary/20">
                <CardContent className="p-8">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
                                <Calendar className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold">{month?.name}</h2>
                                <p className="text-muted-foreground">{stats?.total} piezas de contenido</p>
                            </div>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-6">
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-muted-foreground">Progreso de aprobación</span>
                            <span className="font-semibold">{stats?.progress}%</span>
                        </div>
                        <div className="h-3 bg-secondary rounded-full overflow-hidden">
                            <div
                                className="h-full gradient-primary rounded-full transition-all duration-500"
                                style={{ width: `${stats?.progress || 0}%` }}
                            />
                        </div>
                    </div>

                    {/* Stats - BIG NUMBERS */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                            <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                            <div className="text-3xl font-bold text-emerald-500">{stats?.approved || 0}</div>
                            <div className="text-sm text-emerald-500/80">Aprobados</div>
                        </div>
                        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
                            <Clock className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                            <div className="text-3xl font-bold text-amber-500">{stats?.pending || 0}</div>
                            <div className="text-sm text-amber-500/80">Pendientes</div>
                        </div>
                    </div>

                    {/* Main Action - BIG BUTTON */}
                    <Link href="/portal/content" className="block">
                        <Button size="lg" className="w-full text-lg py-6">
                            Ver y Aprobar Contenido
                            <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>
                    </Link>
                </CardContent>
            </Card>

            {/* Secondary Actions */}
            <div className="grid sm:grid-cols-2 gap-4">
                <Link href="/portal/downloads">
                    <Card className="p-6 hover:border-primary/50 transition-colors cursor-pointer h-full">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                                <Download className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg">Descargar Todo</h3>
                                <p className="text-muted-foreground">Obtener archivos listos</p>
                            </div>
                        </div>
                    </Card>
                </Link>

                <Card className="p-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                            <span className="text-2xl">💬</span>
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg">¿Necesitas ayuda?</h3>
                            <p className="text-muted-foreground">Escríbenos por WhatsApp</p>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    )
}
