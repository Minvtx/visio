'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/badge'
import {
    Plus,
    Search,
    MoreHorizontal,
    Calendar,
    FileText,
    Building2,
    Users,
    X
} from 'lucide-react'
import Link from 'next/link'

interface Client {
    id: string
    name: string
    slug: string
    industry: string | null
    description: string | null
    plan: { name: string } | null
    contentMonths: Array<{
        month: number
        year: number
        status: string
        _count: { pieces: number }
    }>
    _count: {
        contentMonths: number
        users: number
    }
    createdAt: string
}

export default function ClientsPage() {
    const [clients, setClients] = useState<Client[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [search, setSearch] = useState('')
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        industry: '',
        description: '',
    })
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        fetchClients()
    }, [])

    const fetchClients = async () => {
        try {
            const res = await fetch('/api/clients')
            if (res.ok) {
                const data = await res.json()
                setClients(data)
            }
        } catch (err) {
            console.error('Error fetching clients:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setSubmitting(true)

        try {
            const res = await fetch('/api/clients', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            })

            const data = await res.json()

            if (!res.ok) {
                setError(data.error)
            } else {
                setShowModal(false)
                setFormData({ name: '', slug: '', industry: '', description: '' })
                fetchClients()
            }
        } catch (err) {
            setError('Error al crear cliente')
        } finally {
            setSubmitting(false)
        }
    }

    // Auto-generate slug from name
    const handleNameChange = (name: string) => {
        const slug = name
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
        setFormData({ ...formData, name, slug })
    }

    const filteredClients = clients.filter(client =>
        client.name.toLowerCase().includes(search.toLowerCase()) ||
        (client.industry?.toLowerCase() || '').includes(search.toLowerCase())
    )

    const monthNames = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Clientes</h1>
                    <p className="text-muted-foreground mt-1">
                        Gestiona tus clientes y su contenido mensual
                    </p>
                </div>
                <Button onClick={() => setShowModal(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Nuevo Cliente
                </Button>
            </div>

            {/* Search & Filters */}
            <div className="flex gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Buscar clientes..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                </div>
            </div>

            {/* Clients Grid */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                </div>
            ) : filteredClients.length === 0 ? (
                <Card className="p-12">
                    <div className="text-center">
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                            <Building2 className="w-8 h-8 text-primary" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">
                            {clients.length === 0 ? 'No hay clientes' : 'Sin resultados'}
                        </h3>
                        <p className="text-muted-foreground mb-4">
                            {clients.length === 0
                                ? 'Crea tu primer cliente para comenzar a generar contenido'
                                : 'No se encontraron clientes con ese criterio'}
                        </p>
                        {clients.length === 0 && (
                            <Button onClick={() => setShowModal(true)}>
                                <Plus className="w-4 h-4 mr-2" />
                                Crear Primer Cliente
                            </Button>
                        )}
                    </div>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {filteredClients.map((client) => (
                        <ClientCard key={client.id} client={client} monthNames={monthNames} />
                    ))}
                </div>
            )}

            {/* Create Client Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-background border border-border rounded-2xl w-full max-w-md shadow-xl">
                        <div className="flex items-center justify-between p-6 border-b border-border">
                            <h2 className="text-xl font-semibold">Nuevo Cliente</h2>
                            <Button variant="ghost" size="sm" onClick={() => setShowModal(false)}>
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {error && (
                                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
                                    {error}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium mb-2">Nombre del Cliente *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => handleNameChange(e.target.value)}
                                    placeholder="Ej: Mi Empresa SA"
                                    className="w-full px-4 py-2 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Slug (URL) *</label>
                                <input
                                    type="text"
                                    value={formData.slug}
                                    onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                                    placeholder="mi-empresa-sa"
                                    className="w-full px-4 py-2 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
                                    required
                                />
                                <p className="text-xs text-muted-foreground mt-1">Solo letras minúsculas, números y guiones</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Industria</label>
                                <input
                                    type="text"
                                    value={formData.industry}
                                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                                    placeholder="Ej: Tecnología, Gastronomía, Moda..."
                                    className="w-full px-4 py-2 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Descripción</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Breve descripción del cliente..."
                                    rows={3}
                                    className="w-full px-4 py-2 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <Button type="button" variant="outline" onClick={() => setShowModal(false)} className="flex-1">
                                    Cancelar
                                </Button>
                                <Button type="submit" disabled={submitting} className="flex-1">
                                    {submitting ? 'Creando...' : 'Crear Cliente'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

function ClientCard({ client, monthNames }: { client: Client; monthNames: string[] }) {
    const latestMonth = client.contentMonths?.[0]
    const initials = client.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

    return (
        <Link href={`/admin/clients/${client.id}`}>
            <Card className="hover:border-primary/50 transition-all cursor-pointer group">
                <CardContent className="p-5">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white font-semibold">
                                {initials}
                            </div>
                            <div>
                                <h3 className="font-semibold group-hover:text-primary transition-colors">
                                    {client.name}
                                </h3>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Building2 className="w-3 h-3" />
                                    {client.industry || 'Sin industria'}
                                </div>
                            </div>
                        </div>
                        <button
                            className="p-1.5 rounded-lg hover:bg-secondary opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => { e.preventDefault(); }}
                        >
                            <MoreHorizontal className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Current Month Status */}
                    <div className="p-3 rounded-lg bg-secondary/50 mb-4">
                        {latestMonth ? (
                            <>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium">
                                        {monthNames[latestMonth.month]} {latestMonth.year}
                                    </span>
                                    <StatusBadge status={latestMonth.status} />
                                </div>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                        <FileText className="w-3.5 h-3.5" />
                                        {latestMonth._count.pieces} piezas
                                    </span>
                                </div>
                            </>
                        ) : (
                            <div className="text-sm text-muted-foreground text-center py-2">
                                Sin meses de contenido
                            </div>
                        )}
                    </div>

                    {/* Stats */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" />
                                {client._count.contentMonths} meses
                            </span>
                            <span className="flex items-center gap-1">
                                <Users className="w-3.5 h-3.5" />
                                {client._count.users} usuarios
                            </span>
                        </div>
                        <span className="text-xs text-muted-foreground group-hover:text-primary transition-colors">
                            Ver →
                        </span>
                    </div>
                </CardContent>
            </Card>
        </Link>
    )
}
