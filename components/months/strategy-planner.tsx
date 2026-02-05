'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { X, Plus, ChevronRight, ChevronLeft, Target, Rocket, Calendar as CalendarIcon, Lightbulb, Sparkles, Loader2 } from 'lucide-react'

interface StrategyPlannerProps {
    monthId: string
    monthName: string
    onComplete: () => void
}

const STEPS = [
    { id: 'objective', title: 'Objetivo Principal', description: '¿Qué queremos lograr este mes?', icon: Target },
    { id: 'campaigns', title: 'Campañas Activas', description: 'Promociones o lanzamientos.', icon: Rocket },
    { id: 'dates', title: 'Fechas Clave', description: 'Efemérides y eventos relevantes.', icon: CalendarIcon },
    { id: 'inputs', title: 'Focos Específicos', description: 'Contexto extra y material propio.', icon: Lightbulb },
    { id: 'pillars', title: 'Pilares de Contenido', description: 'Temáticas prioritarias.', icon: Target },
]

export function MonthlyStrategyPlanner({ monthId, monthName, onComplete }: StrategyPlannerProps) {
    const [currentStep, setCurrentStep] = useState(0)
    const [saving, setSaving] = useState(false)
    const [loadingMonth, setLoadingMonth] = useState(true)
    const [monthData, setMonthData] = useState<any>(null)
    const [suggestingDates, setSuggestingDates] = useState(false)
    const [formData, setFormData] = useState({
        primaryObjective: '',
        specificGoal: '',
        activeCampaigns: [] as any[], // { name, objective }
        relevantDates: [] as any[], // { date, event }
        strategicInputs: [] as any[], // { description, type, assetId }
        contentPillars: [] as any[], // { name, description }

        // Temporary inputs
        newCampaignName: '',
        newCampaignObj: '',
        newDateDate: '',
        newDateEvent: '',
        newInputDesc: '',
        newInputType: 'post',
        newPillarName: '',
        newPillarDesc: '',
    })

    const handleSave = async () => {
        setSaving(true)
        try {
            await fetch(`/api/months/${monthId}/strategy`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    primaryObjective: formData.primaryObjective,
                    specificGoal: formData.specificGoal,
                    activeCampaigns: formData.activeCampaigns,
                    relevantDates: formData.relevantDates,
                    contentPillars: formData.contentPillars,
                    strategicInputs: formData.strategicInputs,
                })
            })

            // Trigger generation logic is handled by parent or next separate call
            // But here we just save strategy
            onComplete()
        } catch (error) {
            console.error('Error saving strategy:', error)
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

    useEffect(() => {
        const fetchMonth = async () => {
            try {
                const res = await fetch(`/api/months/${monthId}`)
                if (res.ok) {
                    const data = await res.json()
                    setMonthData(data)
                    setFormData(prev => ({
                        ...prev,
                        primaryObjective: data.primaryObjective || '',
                        specificGoal: data.specificGoal || '',
                        activeCampaigns: data.activeCampaigns || [],
                        relevantDates: data.relevantDates || [],
                        contentPillars: data.contentPillars || [],
                        strategicInputs: data.strategicInputs || [],
                    }))
                }
            } catch (err) {
                console.error('Error fetching month:', err)
            } finally {
                setLoadingMonth(false)
            }
        }
        fetchMonth()
    }, [monthId])

    const handleSuggestDates = async () => {
        if (!monthData?.client?.country) {
            alert('Define primero el país del cliente en su perfil para sugerencias precisas.')
            return
        }

        setSuggestingDates(true)
        try {
            const res = await fetch('/api/skills/local-dates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    country: monthData.client.country,
                    month: monthData.month,
                    year: monthData.year,
                    industry: monthData.client.industry
                })
            })

            if (res.ok) {
                const data = await res.json()
                if (data.dates && data.dates.length > 0) {
                    // Filter out dates that are already added
                    const newDates = data.dates.filter((d: any) =>
                        !formData.relevantDates.some((existing: any) => existing.date === d.date)
                    )
                    setFormData(prev => ({
                        ...prev,
                        relevantDates: [...prev.relevantDates, ...newDates]
                    }))
                }
            }
        } catch (err) {
            console.error('Error suggesting dates:', err)
        } finally {
            setSuggestingDates(false)
        }
    }

    const prevStep = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1)
        }
    }

    const addCampaign = () => {
        if (!formData.newCampaignName) return
        setFormData(prev => ({
            ...prev,
            activeCampaigns: [...prev.activeCampaigns, { name: prev.newCampaignName, objective: prev.newCampaignObj }],
            newCampaignName: '',
            newCampaignObj: ''
        }))
    }

    const addDate = () => {
        if (!formData.newDateEvent || !formData.newDateDate) return
        setFormData(prev => ({
            ...prev,
            relevantDates: [...prev.relevantDates, { event: prev.newDateEvent, date: prev.newDateDate }],
            newDateEvent: '',
            newDateDate: ''
        }))
    }

    const addPillar = () => {
        if (!formData.newPillarName) return
        setFormData(prev => ({
            ...prev,
            contentPillars: [...prev.contentPillars, { name: prev.newPillarName, description: prev.newPillarDesc }],
            newPillarName: '',
            newPillarDesc: ''
        }))
    }

    const addStrategicInput = () => {
        if (!formData.newInputDesc) return
        setFormData(prev => ({
            ...prev,
            strategicInputs: [...prev.strategicInputs, {
                id: Math.random().toString(36).substr(2, 9),
                description: prev.newInputDesc,
                type: prev.newInputType
            }],
            newInputDesc: ''
        }))
    }

    const removeArrayItem = (field: string, index: number) => {
        setFormData(prev => ({
            ...prev,
            [field]: (prev as any)[field].filter((_: any, i: number) => i !== index)
        }))
    }

    return (
        <div className="max-w-4xl mx-auto py-4">
            {/* Progress Steps */}
            <div className="flex justify-between mb-8 relative">
                <div className="absolute top-1/2 left-0 right-0 h-1 bg-border -z-10" />
                {STEPS.map((step, idx) => {
                    const Icon = step.icon
                    return (
                        <div
                            key={step.id}
                            className={`flex flex-col items-center gap-2 bg-background px-2 ${idx <= currentStep ? 'text-primary' : 'text-muted-foreground'
                                }`}
                        >
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${idx <= currentStep
                                ? 'border-primary bg-primary text-primary-foreground'
                                : 'border-muted-foreground/30 bg-background'
                                }`}>
                                <Icon className="w-5 h-5" />
                            </div>
                            <span className="text-xs font-medium">{step.title}</span>
                        </div>
                    )
                })}
            </div>

            <Card className="min-h-[450px] flex flex-col">
                <CardHeader>
                    <CardTitle>Estrategia para {monthName}</CardTitle>
                    <CardDescription>{STEPS[currentStep].description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 space-y-6">
                    {/* STEP 1: OBJECTIVE */}
                    {currentStep === 0 && (
                        <div className="space-y-4">
                            <div className="grid gap-2">
                                <Label>Objetivo Principal</Label>
                                <div className="grid grid-cols-2 gap-4">
                                    {['Awareness / Alcance', 'Engagement / Comunidad', 'Tráfico Web', 'Ventas / Conversión'].map(obj => (
                                        <div
                                            key={obj}
                                            onClick={() => setFormData({ ...formData, primaryObjective: obj })}
                                            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${formData.primaryObjective === obj
                                                ? 'border-primary bg-primary/5'
                                                : 'border-border hover:border-primary/50'
                                                }`}
                                        >
                                            <div className="font-semibold">{obj}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label>Meta Específica (KPI)</Label>
                                <Input
                                    placeholder="Ej: Aumentar seguidores en un 10%, Conseguir 50 leads..."
                                    value={formData.specificGoal}
                                    onChange={e => setFormData({ ...formData, specificGoal: e.target.value })}
                                />
                            </div>
                        </div>
                    )}

                    {/* STEP 2: CAMPAIGNS */}
                    {currentStep === 1 && (
                        <div className="space-y-6">
                            <div className="flex gap-4 items-end bg-muted/50 p-4 rounded-lg">
                                <div className="grid gap-2 flex-1">
                                    <Label>Nombre de Campaña</Label>
                                    <Input
                                        placeholder="Ej: Black Friday"
                                        value={formData.newCampaignName}
                                        onChange={e => setFormData({ ...formData, newCampaignName: e.target.value })}
                                    />
                                </div>
                                <div className="grid gap-2 flex-1">
                                    <Label>Objetivo Específico</Label>
                                    <Input
                                        placeholder="Ej: Vender stock antiguo"
                                        value={formData.newCampaignObj}
                                        onChange={e => setFormData({ ...formData, newCampaignObj: e.target.value })}
                                    />
                                </div>
                                <Button onClick={addCampaign} size="icon">
                                    <Plus className="w-4 h-4" />
                                </Button>
                            </div>

                            <div className="space-y-2">
                                {formData.activeCampaigns.map((camp, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 border rounded-lg bg-background">
                                        <div>
                                            <div className="font-medium">{camp.name}</div>
                                            <div className="text-sm text-muted-foreground">{camp.objective}</div>
                                        </div>
                                        <Button variant="ghost" size="sm" onClick={() => removeArrayItem('activeCampaigns', idx)}>
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))}
                                {formData.activeCampaigns.length === 0 && (
                                    <div className="text-center py-8 text-muted-foreground text-sm">
                                        No hay campañas activas. El contenido será general de marca.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* STEP 3: DATES */}
                    {currentStep === 2 && (
                        <div className="space-y-6">
                            <div className="flex gap-4 items-end bg-muted/50 p-4 rounded-lg">
                                <div className="grid gap-2 w-40">
                                    <Label>Fecha</Label>
                                    <Input
                                        type="date"
                                        value={formData.newDateDate}
                                        onChange={e => setFormData({ ...formData, newDateDate: e.target.value })}
                                    />
                                </div>
                                <div className="grid gap-2 flex-1">
                                    <Label>Evento / Efeméride</Label>
                                    <Input
                                        placeholder="Ej: Lanzamiento web, Día de la Madre..."
                                        value={formData.newDateEvent}
                                        onChange={e => setFormData({ ...formData, newDateEvent: e.target.value })}
                                    />
                                </div>
                                <Button onClick={addDate} size="icon">
                                    <Plus className="w-4 h-4" />
                                </Button>
                            </div>

                            <div className="space-y-2">
                                {formData.relevantDates.map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 border rounded-lg bg-background">
                                        <div className="flex items-center gap-4">
                                            <Badge variant="default">{item.date}</Badge>
                                            <span className="font-medium">{item.event}</span>
                                        </div>
                                        <Button variant="ghost" size="sm" onClick={() => removeArrayItem('relevantDates', idx)}>
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))}
                                {formData.relevantDates.length === 0 && (
                                    <div className="text-center py-8 text-muted-foreground text-sm">
                                        No hay fechas clave agregadas.
                                    </div>
                                )}
                            </div>

                            {/* IA Suggestions Button */}
                            <div className="pt-4 border-t">
                                <Button
                                    variant="outline"
                                    className="w-full border-dashed border-primary/30 hover:border-primary/60 hover:bg-primary/5 group"
                                    onClick={handleSuggestDates}
                                    disabled={suggestingDates}
                                >
                                    {suggestingDates ? (
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    ) : (
                                        <Sparkles className="w-4 h-4 mr-2 text-primary group-hover:animate-pulse" />
                                    )}
                                    Sugerir fechas para este mes ({monthData?.client?.country || 'país no definido'})
                                </Button>
                                <p className="text-[10px] text-center text-muted-foreground mt-2">
                                    La IA buscará efemérides y feriados locales relevantes para este cliente.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* STEP 4: STRATEGIC INPUTS */}
                    {currentStep === 3 && (
                        <div className="space-y-6">
                            <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg text-sm">
                                <p className="font-medium text-primary mb-1">💡 ¿Tienes algo específico en mente?</p>
                                <p className="text-muted-foreground">
                                    Si tienes una foto lista, un evento que ya confirmaste o simplemente un tema que "sí o sí"
                                    quieres cubrir, agrégalo aquí. El Wizard lo integrará en el calendario.
                                </p>
                            </div>

                            <div className="flex gap-4 items-end bg-muted/50 p-4 rounded-lg">
                                <div className="grid gap-2 flex-1">
                                    <Label>Descripción del Evento / Contexto</Label>
                                    <Textarea
                                        placeholder="Ej: El viernes 15 inauguramos el local nuevo. Tengo fotos del frente. Resaltar alegría..."
                                        value={formData.newInputDesc}
                                        onChange={e => setFormData({ ...formData, newInputDesc: e.target.value })}
                                        className="h-20"
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label>Formato</Label>
                                    <select
                                        className="h-10 px-3 rounded-md border border-input bg-background"
                                        value={formData.newInputType}
                                        onChange={e => setFormData({ ...formData, newInputType: e.target.value })}
                                    >
                                        <option value="post">Post / Foto</option>
                                        <option value="reel">Reel / Video</option>
                                        <option value="story">Story</option>
                                        <option value="carousel">Carrusel</option>
                                    </select>
                                    <Button onClick={addStrategicInput}>
                                        Agregar
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                {formData.strategicInputs.map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 border rounded-lg bg-background">
                                        <div className="flex items-center gap-4">
                                            <Badge variant="info" className="capitalize">{item.type}</Badge>
                                            <span className="text-sm">{item.description}</span>
                                        </div>
                                        <Button variant="ghost" size="sm" onClick={() => removeArrayItem('strategicInputs', idx)}>
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))}
                                {formData.strategicInputs.length === 0 && (
                                    <div className="text-center py-6 text-muted-foreground text-sm border-2 border-dashed rounded-lg">
                                        Sin focos específicos. La IA creará contenido general basado en pilares.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* STEP 5: PILLARS */}
                    {currentStep === 4 && (
                        <div className="space-y-6">
                            <div className="flex gap-4 items-end bg-muted/50 p-4 rounded-lg">
                                <div className="grid gap-2 flex-1">
                                    <Label>Pilar / Tema</Label>
                                    <Input
                                        placeholder="Ej: Educativo, Lifestyle..."
                                        value={formData.newPillarName}
                                        onChange={e => setFormData({ ...formData, newPillarName: e.target.value })}
                                    />
                                </div>
                                <div className="grid gap-2 flex-1">
                                    <Label>Descripción Breve</Label>
                                    <Input
                                        placeholder="Ej: Tips rápidos para usuarios"
                                        value={formData.newPillarDesc}
                                        onChange={e => setFormData({ ...formData, newPillarDesc: e.target.value })}
                                    />
                                </div>
                                <Button onClick={addPillar} size="icon">
                                    <Plus className="w-4 h-4" />
                                </Button>
                            </div>

                            <div className="space-y-2">
                                {formData.contentPillars.map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 border rounded-lg bg-background">
                                        <div>
                                            <div className="font-medium">{item.name}</div>
                                            <div className="text-sm text-muted-foreground">{item.description}</div>
                                        </div>
                                        <Button variant="ghost" size="sm" onClick={() => removeArrayItem('contentPillars', idx)}>
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))}
                                {formData.contentPillars.length === 0 && (
                                    <div className="text-center py-8 text-muted-foreground text-sm">
                                        Si no defines pilares, la IA los sugerirá automáticamente.
                                    </div>
                                )}
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
                                {saving ? 'Guardando...' : 'Generar Contenido'}
                                <Rocket className="w-4 h-4 ml-2" />
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
