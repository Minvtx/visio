'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Users,
    Plus,
    Shield,
    User as UserIcon,
    MoreVertical,
    Trash2,
    Edit,
    X,
    Copy,
    Check,
    Mail
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface User {
    id: string
    email: string
    name: string
    role: 'ADMIN' | 'MANAGER' | 'CREATOR' | 'REVIEWER' | 'CLIENT'
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
    const [modalType, setModalType] = useState<'TEAM' | 'CLIENT'>('TEAM')
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'ADMIN' as User['role'],
        clientId: '',
    })
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')
    const [copiedEmail, setCopiedEmail] = useState<string | null>(null)

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

    const openModal = (type: 'TEAM' | 'CLIENT') => {
        setModalType(type)
        setFormData({
            name: '',
            email: '',
            password: '',
            role: type === 'TEAM' ? 'ADMIN' : 'CLIENT',
            clientId: ''
        })
        setShowModal(true)
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

    const copyLoginInstructions = (email: string) => {
        const text = `Hola! Te invito a unirte a Visio.\n\nEntra en ${window.location.origin}/login\nInicia sesión con Google usando este email: ${email}`
        navigator.clipboard.writeText(text)
        setCopiedEmail(email)
        setTimeout(() => setCopiedEmail(null), 2000)
    }

    const teamUsers = users.filter(u => u.role !== 'CLIENT')
    const clientUsers = users.filter(u => u.role === 'CLIENT')

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Gestión de Usuarios</h1>
                    {/* <p className="text-muted-foreground mt-1">
                        Controla el acceso de tu equipo y tus clientes
                    </p> */}
                </div>
            </div>

            <Tabs defaultValue="team" className="w-full">
                <TabsList className="mb-4">
                    <TabsTrigger value="team">Mi Equipo ({teamUsers.length})</TabsTrigger>
                    <TabsTrigger value="clients">Clientes ({clientUsers.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="team">
                    <div className="flex justify-end mb-4">
                        <Button onClick={() => openModal('TEAM')}>
                            <Plus className="w-4 h-4 mr-2" />
                            Invitar Miembro
                        </Button>
                    </div>
                    <UsersTable
                        users={teamUsers}
                        onDelete={handleDelete}
                        onCopy={copyLoginInstructions}
                        copiedId={copiedEmail}
                    />
                </TabsContent>

                <TabsContent value="clients">
                    <div className="flex justify-end mb-4">
                        <Button onClick={() => openModal('CLIENT')}>
                            <Plus className="w-4 h-4 mr-2" />
                            Nuevo Usuario Cliente
                        </Button>
                    </div>
                    <UsersTable
                        users={clientUsers}
                        onDelete={handleDelete}
                        onCopy={copyLoginInstructions}
                        copiedId={copiedEmail}
                        showClientName
                    />
                </TabsContent>
            </Tabs>

            {/* Create User Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-background border border-border rounded-2xl w-full max-w-md shadow-xl">
                        <div className="flex items-center justify-between p-6 border-b border-border">
                            <h2 className="text-xl font-semibold">
                                {modalType === 'TEAM' ? 'Invitar al Equipo' : 'Nuevo Usuario Cliente'}
                            </h2>
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

                            {modalType === 'TEAM' && (
                                <div>
                                    <label className="block text-sm font-medium mb-2">Rol</label>
                                    <select
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                                        className="w-full px-4 py-2 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                    >
                                        <option value="ADMIN">Admin (Acceso total)</option>
                                        <option value="MANAGER">Manager (Gestión clientes)</option>
                                        <option value="CREATOR">Creador (Contenido)</option>
                                        <option value="REVIEWER">Revisor (Solo lectura)</option>
                                    </select>
                                </div>
                            )}

                            {modalType === 'CLIENT' && (
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

                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Contraseña <span className="text-muted-foreground font-normal">(Opcional)</span>
                                </label>
                                <input
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full px-4 py-2 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                    placeholder="Dejar vacío para Login con Google"
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    Si la dejas vacía, el usuario deberá iniciar sesión con Google.
                                </p>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <Button type="button" variant="outline" onClick={() => setShowModal(false)} className="flex-1">
                                    Cancelar
                                </Button>
                                <Button type="submit" disabled={submitting} className="flex-1">
                                    {submitting ? 'Guardando...' : modalType === 'TEAM' ? 'Enviar Invitación' : 'Crear Usuario'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

function UsersTable({ users, onDelete, onCopy, copiedId, showClientName }: {
    users: User[],
    onDelete: (id: string) => void,
    onCopy: (email: string) => void,
    copiedId: string | null,
    showClientName?: boolean
}) {
    if (users.length === 0) {
        return (
            <Card className="p-8 text-center text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No hay usuarios en esta lista</p>
            </Card>
        )
    }

    return (
        <Card>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-border">
                            <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Usuario</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Rol</th>
                            {showClientName && <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Cliente</th>}
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
                                        <div>
                                            <div className="font-medium">{user.name}</div>
                                            <div className="text-sm text-muted-foreground">{user.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="py-4 px-4">
                                    <Badge variant={user.role === 'ADMIN' ? 'default' : 'info'}>
                                        {user.role}
                                    </Badge>
                                </td>
                                {showClientName && (
                                    <td className="py-4 px-4 text-muted-foreground">
                                        {user.client?.name || '-'}
                                    </td>
                                )}
                                <td className="py-4 px-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => onCopy(user.email)}
                                            title="Copiar instrucciones de login"
                                        >
                                            {copiedId === user.email ? (
                                                <Check className="w-4 h-4 text-green-500" />
                                            ) : (
                                                <Copy className="w-4 h-4" />
                                            )}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => onDelete(user.id)}
                                            className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    )
}
