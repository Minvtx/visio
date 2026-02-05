'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BookOpen, Plus, X, Loader2, Save, Pencil, Users, Package, Globe } from 'lucide-react'

interface Audience {
    name: string
    description?: string
    demographics?: string
}

interface Product {
    name: string
    description?: string
    benefits?: string[]
}

interface KnowledgeBaseData {
    about: string | null
    mission?: string
    vision?: string
    targetAudience?: Audience[]
    products?: Product[]
    competitors?: string[]
    uniqueValue?: string
    locations?: string[]
}

interface Props {
    clientId: string
    initialData: KnowledgeBaseData | null
    onSave: () => void
}

export function KnowledgeBaseEditor({ clientId, initialData, onSave }: Props) {
    const [isEditing, setIsEditing] = useState(false)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    // Form state
    const [about, setAbout] = useState(initialData?.about || '')
    const [mission, setMission] = useState(initialData?.mission || '')
    const [uniqueValue, setUniqueValue] = useState(initialData?.uniqueValue || '')
    const [audiences, setAudiences] = useState<Audience[]>(initialData?.targetAudience || [])
    const [products, setProducts] = useState<Product[]>(initialData?.products || [])
    const [competitors, setCompetitors] = useState<string[]>(initialData?.competitors || [])

    // Input states
    const [newAudience, setNewAudience] = useState({ name: '', description: '' })
    const [newProduct, setNewProduct] = useState({ name: '', description: '' })
    const [newCompetitor, setNewCompetitor] = useState('')

    const handleSave = async () => {
        setSaving(true)
        setError('')

        try {
            const res = await fetch(`/api/clients/${clientId}/knowledge-base`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    about,
                    mission,
                    uniqueValue,
                    targetAudience: audiences,
                    products,
                    competitors,
                }),
            })

            if (!res.ok) throw new Error('Error al guardar')

            setIsEditing(false)
            onSave()
        } catch (err) {
            setError('Error al guardar cambios')
        } finally {
            setSaving(false)
        }
    }

    const addAudience = () => {
        if (newAudience.name.trim()) {
            setAudiences([...audiences, { ...newAudience }])
            setNewAudience({ name: '', description: '' })
        }
    }

    const addProduct = () => {
        if (newProduct.name.trim()) {
            setProducts([...products, { ...newProduct, benefits: [] }])
            setNewProduct({ name: '', description: '' })
        }
    }

    const addCompetitor = () => {
        if (newCompetitor.trim() && !competitors.includes(newCompetitor.trim())) {
            setCompetitors([...competitors, newCompetitor.trim()])
            setNewCompetitor('')
        }
    }

    if (!isEditing) {
        return (
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <BookOpen className="w-5 h-5" />
                        Knowledge Base
                    </CardTitle>
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                        <Pencil className="w-4 h-4 mr-2" />
                        Editar
                    </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                    {initialData?.about ? (
                        <>
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Sobre la marca</label>
                                <div className="mt-1 p-3 rounded-lg bg-secondary whitespace-pre-wrap">
                                    {initialData.about}
                                </div>
                            </div>

                            {initialData.uniqueValue && (
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Propuesta de valor</label>
                                    <div className="mt-1 p-3 rounded-lg bg-primary/10 border border-primary/20">
                                        {initialData.uniqueValue}
                                    </div>
                                </div>
                            )}

                            {initialData.targetAudience && initialData.targetAudience.length > 0 && (
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Audiencias objetivo</label>
                                    <div className="mt-2 grid gap-2">
                                        {initialData.targetAudience.map((a, i) => (
                                            <div key={i} className="p-3 rounded-lg bg-secondary">
                                                <div className="font-medium">{a.name}</div>
                                                {a.description && (
                                                    <div className="text-sm text-muted-foreground mt-1">{a.description}</div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {initialData.products && initialData.products.length > 0 && (
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Productos/Servicios</label>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {initialData.products.map((p, i) => (
                                            <span key={i} className="px-3 py-1 bg-secondary rounded text-sm">
                                                {p.name}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {initialData.competitors && initialData.competitors.length > 0 && (
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Competencia</label>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {initialData.competitors.map((c, i) => (
                                            <span key={i} className="px-2 py-1 bg-amber-500/10 text-amber-600 rounded text-sm">
                                                {c}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <p className="text-muted-foreground text-sm italic">
                            Agrega información sobre la marca para mejorar la generación de contenido.
                        </p>
                    )}
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="border-primary/50">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-primary" />
                    Editar Knowledge Base
                </CardTitle>
                <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)} disabled={saving}>
                        Cancelar
                    </Button>
                    <Button size="sm" onClick={handleSave} disabled={saving}>
                        {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                        Guardar
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
                        {error}
                    </div>
                )}

                {/* About */}
                <div>
                    <label className="block text-sm font-medium mb-2">
                        <Globe className="w-4 h-4 inline mr-2" />
                        Sobre la marca
                    </label>
                    <textarea
                        value={about}
                        onChange={(e) => setAbout(e.target.value)}
                        placeholder="¿Qué hace la marca? ¿Cuál es su historia? ¿Qué la hace especial?"
                        rows={4}
                        className="w-full px-4 py-3 bg-secondary border border-border rounded-lg resize-none"
                    />
                </div>

                {/* Unique Value Proposition */}
                <div>
                    <label className="block text-sm font-medium mb-2">
                        Propuesta de valor única
                    </label>
                    <input
                        type="text"
                        value={uniqueValue}
                        onChange={(e) => setUniqueValue(e.target.value)}
                        placeholder="¿Por qué los clientes deberían elegirte?"
                        className="w-full px-4 py-2 bg-secondary border border-border rounded-lg"
                    />
                </div>

                {/* Mission */}
                <div>
                    <label className="block text-sm font-medium mb-2">
                        Misión (opcional)
                    </label>
                    <input
                        type="text"
                        value={mission}
                        onChange={(e) => setMission(e.target.value)}
                        placeholder="La misión de la marca..."
                        className="w-full px-4 py-2 bg-secondary border border-border rounded-lg"
                    />
                </div>

                {/* Target Audiences */}
                <div>
                    <label className="block text-sm font-medium mb-2">
                        <Users className="w-4 h-4 inline mr-2" />
                        Audiencias objetivo
                    </label>
                    <div className="space-y-2 mb-3">
                        {audiences.map((a, i) => (
                            <div key={i} className="flex items-start justify-between p-3 bg-secondary rounded-lg">
                                <div>
                                    <div className="font-medium">{a.name}</div>
                                    {a.description && <div className="text-sm text-muted-foreground">{a.description}</div>}
                                </div>
                                <button onClick={() => setAudiences(audiences.filter((_, idx) => idx !== i))} className="hover:text-red-500">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newAudience.name}
                            onChange={(e) => setNewAudience({ ...newAudience, name: e.target.value })}
                            placeholder="Nombre (ej: Emprendedores 25-35)"
                            className="flex-1 px-3 py-2 bg-secondary border border-border rounded-lg text-sm"
                        />
                        <input
                            type="text"
                            value={newAudience.description}
                            onChange={(e) => setNewAudience({ ...newAudience, description: e.target.value })}
                            placeholder="Descripción breve"
                            className="flex-1 px-3 py-2 bg-secondary border border-border rounded-lg text-sm"
                        />
                        <Button variant="outline" size="sm" onClick={addAudience}>
                            <Plus className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                {/* Products/Services */}
                <div>
                    <label className="block text-sm font-medium mb-2">
                        <Package className="w-4 h-4 inline mr-2" />
                        Productos / Servicios
                    </label>
                    <div className="flex flex-wrap gap-2 mb-3">
                        {products.map((p, i) => (
                            <span key={i} className="flex items-center gap-1 px-3 py-1 bg-secondary rounded-full text-sm">
                                {p.name}
                                <button onClick={() => setProducts(products.filter((_, idx) => idx !== i))} className="hover:text-red-500">
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newProduct.name}
                            onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                            placeholder="Nombre del producto/servicio"
                            className="flex-1 px-3 py-2 bg-secondary border border-border rounded-lg text-sm"
                            onKeyDown={(e) => e.key === 'Enter' && addProduct()}
                        />
                        <Button variant="outline" size="sm" onClick={addProduct}>
                            <Plus className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                {/* Competitors */}
                <div>
                    <label className="block text-sm font-medium mb-2">
                        Competencia
                    </label>
                    <div className="flex flex-wrap gap-2 mb-3">
                        {competitors.map((c, i) => (
                            <span key={i} className="flex items-center gap-1 px-2 py-1 bg-amber-500/10 text-amber-600 rounded text-sm">
                                {c}
                                <button onClick={() => setCompetitors(competitors.filter((_, idx) => idx !== i))}>
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newCompetitor}
                            onChange={(e) => setNewCompetitor(e.target.value)}
                            placeholder="Nombre del competidor"
                            className="flex-1 px-3 py-2 bg-secondary border border-border rounded-lg text-sm"
                            onKeyDown={(e) => e.key === 'Enter' && addCompetitor()}
                        />
                        <Button variant="outline" size="sm" onClick={addCompetitor}>
                            <Plus className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
