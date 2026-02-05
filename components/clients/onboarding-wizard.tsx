'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { X, Plus, ChevronRight, ChevronLeft, Bot, Save } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface OnboardingWizardProps {
    clientId: string
    initialData?: any
    onComplete: () => void
}

const STEPS = [
    { id: 'identity', title: 'Identidad de Marca', description: 'Define la personalidad y esencia.' },
    { id: 'voice', title: 'Voz y Tono', description: 'Cómo habla la marca.' },
    { id: 'location', title: 'Contexto Local', description: 'Ubicación y dialecto.' },
    { id: 'knowledge', title: 'Productos y Audiencia', description: 'Qué venden y a quién.' },
    { id: 'guardrails', title: 'Reglas de Oro', description: 'Lo que se puede y no se puede decir.' },
]

export function ClientOnboardingWizard({ clientId, initialData, onComplete }: OnboardingWizardProps) {
    const [currentStep, setCurrentStep] = useState(0)
    const [saving, setSaving] = useState(false)
    const [formData, setFormData] = useState({
        // Identity
        brandPersonality: [] as string[],
        brandArchetype: '',
        tagline: '',
        valueProposition: '',

        // Voice
        primaryTone: '',
        secondaryTone: '',
        communicationStyle: '',
        speakingAs: 'nosotros',
        country: '',
        city: '',
        dialect: '',

        // Knowledge
        products: [] as any[], // { name, description }
        targetAudiences: [] as any[], // { name, painPoints }

        // Guardrails
        forbiddenWords: [] as string[],
        forbiddenTopics: [] as string[],
        requiredMentions: [] as string[],

        ...initialData
    })

    const handleSave = async () => {
        setSaving(true)
        try {
            // Save Brand Kit
            await fetch(`/api/clients/${clientId}/brand`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    brandPersonality: formData.brandPersonality,
                    brandArchetype: formData.brandArchetype,
                    tagline: formData.tagline,
                    valueProposition: formData.valueProposition,
                    primaryTone: formData.primaryTone,
                    secondaryTone: formData.secondaryTone,
                    communicationStyle: formData.communicationStyle,
                    speakingAs: formData.speakingAs,
                    forbiddenWords: formData.forbiddenWords,
                    forbiddenTopics: formData.forbiddenTopics,
                    requiredMentions: formData.requiredMentions,
                })
            })

            // Save Client Location Details
            await fetch(`/api/clients/${clientId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    country: formData.country,
                    city: formData.city,
                    dialect: formData.dialect,
                })
            })

            // Save Knowledge Base
            await fetch(`/api/clients/${clientId}/knowledge`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    products: formData.products,
                    targetAudiences: formData.targetAudiences,
                })
            })

            onComplete()
        } catch (error) {
            console.error('Error saving onboarding:', error)
        } finally {
            setSaving(false)
        }
    }

    const nextStep = () => {
        if (currentStep < STEPS.length - 1) {
            setCurrentStep(currentStep + 1)
        } else {
            handleSave()
        }
    }

    const prevStep = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1)
        }
    }

    // Helper for array inputs (tags)
    const handleArrayInput = (field: string, value: string, action: 'add' | 'remove') => {
        setFormData((prev: any) => {
            const current = prev[field] as string[]
            if (action === 'add' && value.trim()) {
                return { ...prev, [field]: [...current, value.trim()] }
            }
            if (action === 'remove') {
                return { ...prev, [field]: current.filter((i: string) => i !== value) }
            }
            return prev
        })
    }

    return (
        <div className="max-w-4xl mx-auto py-8">
            {/* Progress Steps */}
            <div className="flex justify-between mb-8 relative">
                <div className="absolute top-1/2 left-0 right-0 h-1 bg-border -z-10" />
                {STEPS.map((step, idx) => (
                    <div
                        key={step.id}
                        className={`flex flex-col items-center gap-2 bg-background px-2 ${idx <= currentStep ? 'text-primary' : 'text-muted-foreground'
                            }`}
                    >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${idx <= currentStep
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-muted-foreground/30 bg-background'
                            }`}>
                            {idx + 1}
                        </div>
                        <span className="text-xs font-medium">{step.title}</span>
                    </div>
                ))}
            </div>

            <Card className="min-h-[500px] flex flex-col">
                <CardHeader>
                    <CardTitle>{STEPS[currentStep].title}</CardTitle>
                    <CardDescription>{STEPS[currentStep].description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 space-y-6">
                    {/* STEP 1: IDENTITY */}
                    {currentStep === 0 && (
                        <div className="space-y-4">
                            <div className="grid gap-2">
                                <Label>Arquetipo de Marca</Label>
                                <Input
                                    placeholder="Ej: El Sabio, El Héroe, El Rebelde..."
                                    value={formData.brandArchetype}
                                    onChange={e => setFormData({ ...formData, brandArchetype: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Tagline / Eslogan</Label>
                                <Input
                                    placeholder="Ej: Just Do It"
                                    value={formData.tagline}
                                    onChange={e => setFormData({ ...formData, tagline: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Propuesta de Valor Única</Label>
                                <Textarea
                                    placeholder="¿Qué hace única a la marca? ¿Por qué los eligen?"
                                    value={formData.valueProposition}
                                    onChange={e => setFormData({ ...formData, valueProposition: e.target.value })}
                                />
                            </div>
                        </div>
                    )}

                    {/* STEP 2: VOICE */}
                    {currentStep === 1 && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>Tono Principal</Label>
                                    <Input
                                        placeholder="Ej: Profesional, Divertido, Inspirador..."
                                        value={formData.primaryTone}
                                        onChange={e => setFormData({ ...formData, primaryTone: e.target.value })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Tono Secundario</Label>
                                    <Input
                                        placeholder="Ej: Cercano, Técnico, Irreverente..."
                                        value={formData.secondaryTone}
                                        onChange={e => setFormData({ ...formData, secondaryTone: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label>Estilo de Comunicación</Label>
                                <Input
                                    placeholder="Ej: Frases cortas, mucho emoji, storytelling..."
                                    value={formData.communicationStyle}
                                    onChange={e => setFormData({ ...formData, communicationStyle: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>La marca habla como:</Label>
                                <div className="flex gap-4">
                                    {['nosotros', 'yo', 'la marca'].map(opt => (
                                        <div
                                            key={opt}
                                            onClick={() => setFormData({ ...formData, speakingAs: opt })}
                                            className={`px-4 py-2 rounded-lg border cursor-pointer border-2 ${formData.speakingAs === opt
                                                ? 'border-primary bg-primary/5'
                                                : 'border-border hover:border-primary/50'
                                                }`}
                                        >
                                            {opt.charAt(0).toUpperCase() + opt.slice(1)}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: LOCATION */}
                    {currentStep === 2 && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>País</Label>
                                    <Input
                                        placeholder="Ej: Argentina, México, España..."
                                        value={formData.country}
                                        onChange={e => setFormData({ ...formData, country: e.target.value })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Ciudad (Opcional)</Label>
                                    <Input
                                        placeholder="Ej: Buenos Aires, CDMX, Madrid..."
                                        value={formData.city}
                                        onChange={e => setFormData({ ...formData, city: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label>Dialecto / Variantes del Idioma</Label>
                                <Input
                                    placeholder="Ej: Argentino (voseo suave), Castellano neutro..."
                                    value={formData.dialect}
                                    onChange={e => setFormData({ ...formData, dialect: e.target.value })}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Esto ayuda a la IA a escribir captions que suenen naturales para la ubicación del cliente.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* STEP 4: KNOWLEDGE */}
                    {currentStep === 3 && (
                        <div className="space-y-6">
                            <div className="text-center py-8 text-muted-foreground">
                                <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                <p>Agregaremos los productos y audiencias en la siguiente iteración.</p>
                                <p className="text-sm mt-2">Por ahora, el agente usará la descripción general.</p>
                            </div>
                        </div>
                    )}

                    {/* STEP 5: GUARDRAILS */}
                    {currentStep === 4 && (
                        <div className="space-y-6">
                            <div className="grid gap-2">
                                <Label>Palabras Prohibidas (Enter para agregar)</Label>
                                <div className="flex gap-2 flex-wrap mb-2">
                                    {formData.forbiddenWords.map((word: string) => (
                                        <Badge key={word} variant="error" className="gap-1">
                                            {word}
                                            <X
                                                className="w-3 h-3 cursor-pointer"
                                                onClick={() => handleArrayInput('forbiddenWords', word, 'remove')}
                                            />
                                        </Badge>
                                    ))}
                                </div>
                                <Input
                                    placeholder="Escribe y presiona Enter..."
                                    onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault()
                                            handleArrayInput('forbiddenWords', e.currentTarget.value, 'add')
                                            e.currentTarget.value = ''
                                        }
                                    }}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label>Temas Prohibidos</Label>
                                <div className="flex gap-2 flex-wrap mb-2">
                                    {formData.forbiddenTopics.map((topic: string) => (
                                        <Badge key={topic} variant="warning" className="gap-1 border-destructive text-destructive">
                                            {topic}
                                            <X
                                                className="w-3 h-3 cursor-pointer"
                                                onClick={() => handleArrayInput('forbiddenTopics', topic, 'remove')}
                                            />
                                        </Badge>
                                    ))}
                                </div>
                                <Input
                                    placeholder="Política, Religión, Competencia..."
                                    onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault()
                                            handleArrayInput('forbiddenTopics', e.currentTarget.value, 'add')
                                            e.currentTarget.value = ''
                                        }
                                    }}
                                />
                            </div>
                        </div>
                    )}
                </CardContent>

                <div className="p-6 border-t flex justify-between">
                    <Button
                        variant="ghost"
                        onClick={prevStep}
                        disabled={currentStep === 0 || saving}
                    >
                        <ChevronLeft className="w-4 h-4 mr-2" />
                        Anterior
                    </Button>
                    <Button onClick={nextStep} disabled={saving}>
                        {currentStep === STEPS.length - 1 ? (
                            <>
                                {saving ? 'Guardando...' : 'Finalizar Setup'}
                                <Save className="w-4 h-4 ml-2" />
                            </>
                        ) : (
                            <>
                                Siguiente
                                <ChevronRight className="w-4 h-4 ml-2" />
                            </>
                        )}
                    </Button>
                </div>
            </Card>
        </div>
    )
}
