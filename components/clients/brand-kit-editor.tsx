'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Palette, Plus, X, Check, Loader2, Save, Pencil } from 'lucide-react'

interface BrandKitData {
    tone: string
    personality?: string[]
    guardrails?: string[]
    forbiddenWords?: string[]
    requiredHashtags?: string[]
    samplePhrases?: string[]
}

interface Props {
    clientId: string
    initialData: BrandKitData | null
    onSave: () => void
}

const TONE_OPTIONS = [
    'Profesional pero cercano',
    'Casual y divertido',
    'Elegante y sofisticado',
    'Joven y enérgico',
    'Inspiracional y motivador',
    'Técnico y experto',
    'Cálido y empático',
    'Directo y confiable',
]

const PERSONALITY_TRAITS = [
    'Innovador', 'Confiable', 'Amigable', 'Experto', 'Accesible',
    'Premium', 'Cercano', 'Audaz', 'Minimalista', 'Creativo',
    'Profesional', 'Divertido', 'Serio', 'Inspirador', 'Rebelde'
]

export function BrandKitEditor({ clientId, initialData, onSave }: Props) {
    const [isEditing, setIsEditing] = useState(false)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    // Form state
    const [tone, setTone] = useState(initialData?.tone || '')
    const [customTone, setCustomTone] = useState('')
    const [personality, setPersonality] = useState<string[]>(initialData?.personality || [])
    const [guardrails, setGuardrails] = useState<string[]>(initialData?.guardrails || [])
    const [forbiddenWords, setForbiddenWords] = useState<string[]>(initialData?.forbiddenWords || [])
    const [requiredHashtags, setRequiredHashtags] = useState<string[]>(initialData?.requiredHashtags || [])
    const [samplePhrases, setSamplePhrases] = useState<string[]>(initialData?.samplePhrases || [])

    // Input states for adding items
    const [newGuardrail, setNewGuardrail] = useState('')
    const [newForbidden, setNewForbidden] = useState('')
    const [newHashtag, setNewHashtag] = useState('')
    const [newPhrase, setNewPhrase] = useState('')

    const handleSave = async () => {
        setSaving(true)
        setError('')

        try {
            const res = await fetch(`/api/clients/${clientId}/brand-kit`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tone: tone === 'custom' ? customTone : tone,
                    personality,
                    guardrails,
                    forbiddenWords,
                    requiredHashtags,
                    samplePhrases,
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

    const addItem = (list: string[], setList: (v: string[]) => void, value: string, clear: () => void) => {
        if (value.trim() && !list.includes(value.trim())) {
            setList([...list, value.trim()])
            clear()
        }
    }

    const removeItem = (list: string[], setList: (v: string[]) => void, index: number) => {
        setList(list.filter((_, i) => i !== index))
    }

    const togglePersonality = (trait: string) => {
        if (personality.includes(trait)) {
            setPersonality(personality.filter(p => p !== trait))
        } else if (personality.length < 5) {
            setPersonality([...personality, trait])
        }
    }

    if (!isEditing) {
        return (
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <Palette className="w-5 h-5" />
                        Brand Kit
                    </CardTitle>
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                        <Pencil className="w-4 h-4 mr-2" />
                        Editar
                    </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-muted-foreground">Tono de Voz</label>
                        <div className="mt-1 p-3 rounded-lg bg-secondary">
                            {initialData?.tone || 'No configurado'}
                        </div>
                    </div>

                    {initialData?.personality && initialData.personality.length > 0 && (
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Personalidad</label>
                            <div className="mt-2 flex flex-wrap gap-2">
                                {initialData.personality.map((p, i) => (
                                    <span key={i} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                                        {p}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {initialData?.guardrails && initialData.guardrails.length > 0 && (
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Guardrails</label>
                            <div className="mt-2 flex flex-wrap gap-2">
                                {initialData.guardrails.map((g, i) => (
                                    <span key={i} className="px-2 py-1 bg-secondary rounded text-sm">
                                        {g}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {initialData?.requiredHashtags && initialData.requiredHashtags.length > 0 && (
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Hashtags de marca</label>
                            <div className="mt-2 flex flex-wrap gap-2">
                                {initialData.requiredHashtags.map((h, i) => (
                                    <span key={i} className="px-2 py-1 bg-blue-500/10 text-blue-500 rounded text-sm">
                                        #{h.replace('#', '')}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {(!initialData?.tone || initialData.tone === 'No configurado') && (
                        <p className="text-muted-foreground text-sm italic">
                            Configura el Brand Kit para mejores resultados en la generación de contenido.
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
                    <Palette className="w-5 h-5 text-primary" />
                    Editar Brand Kit
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

                {/* Tone */}
                <div>
                    <label className="block text-sm font-medium mb-3">Tono de Voz</label>
                    <div className="grid grid-cols-2 gap-2">
                        {TONE_OPTIONS.map((option) => (
                            <button
                                key={option}
                                onClick={() => setTone(option)}
                                className={`p-3 rounded-lg text-left text-sm transition-all ${tone === option
                                        ? 'bg-primary text-white'
                                        : 'bg-secondary hover:bg-secondary/80'
                                    }`}
                            >
                                {option}
                            </button>
                        ))}
                        <button
                            onClick={() => setTone('custom')}
                            className={`p-3 rounded-lg text-left text-sm transition-all ${tone === 'custom'
                                    ? 'bg-primary text-white'
                                    : 'bg-secondary hover:bg-secondary/80'
                                }`}
                        >
                            + Personalizado
                        </button>
                    </div>
                    {tone === 'custom' && (
                        <input
                            type="text"
                            value={customTone}
                            onChange={(e) => setCustomTone(e.target.value)}
                            placeholder="Describe el tono de voz..."
                            className="mt-3 w-full px-4 py-2 bg-secondary border border-border rounded-lg"
                        />
                    )}
                </div>

                {/* Personality Traits */}
                <div>
                    <label className="block text-sm font-medium mb-2">
                        Personalidad de marca <span className="text-muted-foreground font-normal">(máx. 5)</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {PERSONALITY_TRAITS.map((trait) => (
                            <button
                                key={trait}
                                onClick={() => togglePersonality(trait)}
                                disabled={!personality.includes(trait) && personality.length >= 5}
                                className={`px-3 py-1.5 rounded-full text-sm transition-all ${personality.includes(trait)
                                        ? 'bg-primary text-white'
                                        : 'bg-secondary hover:bg-secondary/80 disabled:opacity-50'
                                    }`}
                            >
                                {trait}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Guardrails */}
                <div>
                    <label className="block text-sm font-medium mb-2">
                        Guardrails <span className="text-muted-foreground font-normal">(reglas que siempre debe seguir)</span>
                    </label>
                    <div className="flex gap-2 mb-2">
                        <input
                            type="text"
                            value={newGuardrail}
                            onChange={(e) => setNewGuardrail(e.target.value)}
                            placeholder="Ej: Nunca usar jerga técnica"
                            className="flex-1 px-3 py-2 bg-secondary border border-border rounded-lg text-sm"
                            onKeyDown={(e) => e.key === 'Enter' && addItem(guardrails, setGuardrails, newGuardrail, () => setNewGuardrail(''))}
                        />
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => addItem(guardrails, setGuardrails, newGuardrail, () => setNewGuardrail(''))}
                        >
                            <Plus className="w-4 h-4" />
                        </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {guardrails.map((g, i) => (
                            <span key={i} className="flex items-center gap-1 px-2 py-1 bg-secondary rounded text-sm">
                                {g}
                                <button onClick={() => removeItem(guardrails, setGuardrails, i)} className="hover:text-red-500">
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        ))}
                    </div>
                </div>

                {/* Forbidden Words */}
                <div>
                    <label className="block text-sm font-medium mb-2">
                        Palabras prohibidas <span className="text-muted-foreground font-normal">(nunca usar)</span>
                    </label>
                    <div className="flex gap-2 mb-2">
                        <input
                            type="text"
                            value={newForbidden}
                            onChange={(e) => setNewForbidden(e.target.value)}
                            placeholder="Ej: barato, descuento"
                            className="flex-1 px-3 py-2 bg-secondary border border-border rounded-lg text-sm"
                            onKeyDown={(e) => e.key === 'Enter' && addItem(forbiddenWords, setForbiddenWords, newForbidden, () => setNewForbidden(''))}
                        />
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => addItem(forbiddenWords, setForbiddenWords, newForbidden, () => setNewForbidden(''))}
                        >
                            <Plus className="w-4 h-4" />
                        </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {forbiddenWords.map((w, i) => (
                            <span key={i} className="flex items-center gap-1 px-2 py-1 bg-red-500/10 text-red-500 rounded text-sm">
                                {w}
                                <button onClick={() => removeItem(forbiddenWords, setForbiddenWords, i)}>
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        ))}
                    </div>
                </div>

                {/* Required Hashtags */}
                <div>
                    <label className="block text-sm font-medium mb-2">
                        Hashtags de marca <span className="text-muted-foreground font-normal">(siempre incluir)</span>
                    </label>
                    <div className="flex gap-2 mb-2">
                        <input
                            type="text"
                            value={newHashtag}
                            onChange={(e) => setNewHashtag(e.target.value)}
                            placeholder="Ej: #TuMarca"
                            className="flex-1 px-3 py-2 bg-secondary border border-border rounded-lg text-sm"
                            onKeyDown={(e) => e.key === 'Enter' && addItem(requiredHashtags, setRequiredHashtags, newHashtag, () => setNewHashtag(''))}
                        />
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => addItem(requiredHashtags, setRequiredHashtags, newHashtag, () => setNewHashtag(''))}
                        >
                            <Plus className="w-4 h-4" />
                        </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {requiredHashtags.map((h, i) => (
                            <span key={i} className="flex items-center gap-1 px-2 py-1 bg-blue-500/10 text-blue-500 rounded text-sm">
                                #{h.replace('#', '')}
                                <button onClick={() => removeItem(requiredHashtags, setRequiredHashtags, i)}>
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        ))}
                    </div>
                </div>

                {/* Sample Phrases */}
                <div>
                    <label className="block text-sm font-medium mb-2">
                        Frases ejemplo <span className="text-muted-foreground font-normal">(estilo de redacción deseado)</span>
                    </label>
                    <div className="flex gap-2 mb-2">
                        <input
                            type="text"
                            value={newPhrase}
                            onChange={(e) => setNewPhrase(e.target.value)}
                            placeholder="Ej: Transforma tu día con un toque de magia"
                            className="flex-1 px-3 py-2 bg-secondary border border-border rounded-lg text-sm"
                            onKeyDown={(e) => e.key === 'Enter' && addItem(samplePhrases, setSamplePhrases, newPhrase, () => setNewPhrase(''))}
                        />
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => addItem(samplePhrases, setSamplePhrases, newPhrase, () => setNewPhrase(''))}
                        >
                            <Plus className="w-4 h-4" />
                        </Button>
                    </div>
                    <div className="space-y-2">
                        {samplePhrases.map((p, i) => (
                            <div key={i} className="flex items-center justify-between p-2 bg-secondary rounded text-sm italic">
                                "{p}"
                                <button onClick={() => removeItem(samplePhrases, setSamplePhrases, i)} className="hover:text-red-500">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
