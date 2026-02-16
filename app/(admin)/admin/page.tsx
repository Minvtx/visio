import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Users,
    ArrowRight,
    Sparkles,
    Rocket,
} from 'lucide-react'
import Link from 'next/link'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
    const session = await getServerSession(authOptions)
    const workspaceId = session?.user?.workspaceId

    const clientsCount = await prisma.client.count({
        where: {
            workspaceId: workspaceId || undefined
        }
    })

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Dashboard</h1>
                    <p className="text-muted-foreground mt-1">
                        Bienvenido a Content Studio AI
                    </p>
                </div>
            </div>

            {/* Welcome Card - Conditional */}
            {clientsCount === 0 ? (
                <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
                    <CardContent className="p-8">
                        <div className="flex items-start gap-6">
                            <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center flex-shrink-0">
                                <Rocket className="w-8 h-8 text-white" />
                            </div>
                            <div className="flex-1">
                                <h2 className="text-2xl font-bold mb-2">¡Comencemos!</h2>
                                <p className="text-muted-foreground mb-4">
                                    Creá tu primer cliente para empezar a generar contenido con IA.
                                    En minutos vas a tener un mes completo de publicaciones listas.
                                </p>
                                <Link
                                    href="/admin/clients"
                                    className="inline-flex items-center gap-2 px-6 py-3 rounded-lg gradient-primary text-white font-medium hover:opacity-90 transition-opacity"
                                >
                                    <Users className="w-5 h-5" />
                                    Crear mi primer cliente
                                    <ArrowRight className="w-4 h-4" />
                                </Link>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <Card className="border-border bg-card">
                    <CardContent className="p-8">
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center flex-shrink-0">
                                <Users className="w-8 h-8 text-primary" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold mb-2">Tenés {clientsCount} cliente{clientsCount !== 1 ? 's' : ''} activos</h2>
                                <p className="text-muted-foreground">
                                    Seleccioná un cliente para gestionar su contenido o creá uno nuevo.
                                </p>
                            </div>
                            <div className="ml-auto">
                                <Link
                                    href="/admin/clients"
                                    className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-border hover:bg-secondary transition-colors"
                                >
                                    Ver todos los clientes
                                    <ArrowRight className="w-4 h-4" />
                                </Link>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Quick Actions */}
            <div className="grid gap-6 md:grid-cols-2">
                <Link href="/admin/clients">
                    <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
                        <CardHeader>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                                    <Users className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <CardTitle>Clientes</CardTitle>
                                    <p className="text-sm text-muted-foreground">Gestionar marcas y contenido</p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                Creá clientes, definí su Brand Kit y generá contenido mensual automatizado.
                            </p>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/admin/settings">
                    <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
                        <CardHeader>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                                    <Sparkles className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <CardTitle>Configuración</CardTitle>
                                    <p className="text-sm text-muted-foreground">Ajustes de tu workspace</p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                Configurá el nombre de tu agencia y otras preferencias.
                            </p>
                        </CardContent>
                    </Card>
                </Link>
            </div>
        </div>
    )
}
