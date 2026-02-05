'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
    Users,
    Plus,
    Shield,
    User as UserIcon,
    MoreVertical,
    Trash2,
    Edit,
    X
} from 'lucide-react'

interface User {
    id: string
    email: string
    name: string
    role: 'ADMIN' | 'CLIENT'
    clientId: string | null
    client?: { name: string } | null
    createdAt: string
}

interface Client {
    id: string
    name: string
}

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([])
    const [clients, setClients] = useState<Client[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'ADMIN' as 'ADMIN' | 'CLIENT',
        clientId: '',
    })
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        fetchUsers()
        fetchClients()
    }, [])

    const fetchUsers = async () => {
        try {
            const res = await fetch('/api/users')
            if (res.ok) {
                const data = await res.json()
                setUsers(data)
            }
        } catch (err) {
            console.error('Error fetching users:', err)
        } finally {
            setLoading(false)
        }
    }

    const fetchClients = async () => {
        try {
            const res = await fetch('/api/clients')
            if (res.ok) {
                const data = await res.json()
                setClients(data)
            }
        } catch (err) {
            console.error('Error fetching clients:', err)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setSubmitting(true)

        try {
            const res = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            })

            const data = await res.json()

            if (!res.ok) {
                setError(data.error)
            } else {
                setShowModal(false)
                setFormData({ name: '', email: '', password: '', role: 'ADMIN', clientId: '' })
                fetchUsers()
            }
        } catch (err) {
            setError('Error al crear usuario')
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async (userId: string) => {
        if (!confirm('¿Estás seguro de eliminar este usuario?')) return

        try {
            const res = await fetch(`/api/users/${userId}`, { method: 'DELETE' })
            if (res.ok) {
                fetchUsers()
            }
        } catch (err) {
            console.error('Error deleting user:', err)
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Usuarios</h1>
                    <p className="text-muted-foreground mt-1">
                        Gestiona administradores y usuarios de clientes
                    </p>
                </div>
                <Button onClick={() => setShowModal(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Nuevo Usuario
                </Button>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                                <Users className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold">{users.length}</div>
                                <div className="text-sm text-muted-foreground">Total Usuarios</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                                <Shield className="w-6 h-6 text-purple-500" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold">
                                    {users.filter(u => u.role === 'ADMIN').length}
                                </div>
                                <div className="text-sm text-muted-foreground">Administradores</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                <UserIcon className="w-6 h-6 text-blue-500" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold">
                                    {users.filter(u => u.role === 'CLIENT').length}
                                </div>
                                <div className="text-sm text-muted-foreground">Clientes</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Users Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Todos los Usuarios</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                        </div>
                    ) : users.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No hay usuarios registrados
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-border">
                                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Usuario</th>
                                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Email</th>
                                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Rol</th>
                                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Cliente</th>
                                        <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((user) => (
                                        <tr key={user.id} className="border-b border-border last:border-0 hover:bg-secondary/50">
                                            <td className="py-4 px-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                                                        {user.name[0].toUpperCase()}
                                                    </div>
                                                    <span className="font-medium">{user.name}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4 text-muted-foreground">{user.email}</td>
                                            <td className="py-4 px-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${user.role === 'ADMIN'
                                                        ? 'bg-purple-500/10 text-purple-500'
                                                        : 'bg-blue-500/10 text-blue-500'
                                                    }`}>
                                                    {user.role === 'ADMIN' ? <Shield className="w-3 h-3" /> : <UserIcon className="w-3 h-3" />}
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4 text-muted-foreground">
                                                {user.client?.name || '-'}
                                            </td>
                                            <td className="py-4 px-4 text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDelete(user.id)}
                                                    className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Create User Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-background border border-border rounded-2xl w-full max-w-md shadow-xl">
                        <div className="flex items-center justify-between p-6 border-b border-border">
                            <h2 className="text-xl font-semibold">Nuevo Usuario</h2>
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
                                <label className="block text-sm font-medium mb-2">Nombre</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Email</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-4 py-2 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Contraseña (opcional si usa Google)</label>
                                <input
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full px-4 py-2 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                    placeholder="Dejar vacío si usará Google"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Rol</label>
                                <select
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value as 'ADMIN' | 'CLIENT' })}
                                    className="w-full px-4 py-2 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                >
                                    <option value="ADMIN">Administrador</option>
                                    <option value="CLIENT">Cliente</option>
                                </select>
                            </div>

                            {formData.role === 'CLIENT' && (
                                <div>
                                    <label className="block text-sm font-medium mb-2">Asignar a Cliente</label>
                                    <select
                                        value={formData.clientId}
                                        onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                                        className="w-full px-4 py-2 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                        required
                                    >
                                        <option value="">Seleccionar cliente...</option>
                                        {clients.map((client) => (
                                            <option key={client.id} value={client.id}>{client.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="flex gap-3 pt-4">
                                <Button type="button" variant="outline" onClick={() => setShowModal(false)} className="flex-1">
                                    Cancelar
                                </Button>
                                <Button type="submit" disabled={submitting} className="flex-1">
                                    {submitting ? 'Creando...' : 'Crear Usuario'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
