'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
    Sparkles,
    X,
    Loader2,
    CheckCircle,
    Calendar,
    FileText
} from 'lucide-react'

interface GenerateMonthModalProps {
    isOpen: boolean
    onClose: () => void
    clientName: string
    month: string
    year: number
}

const steps = [
    { id: 'snapshot', label: 'Analizando marca...', skill: 'brand_snapshot' },
    { id: 'strategy', label: 'Generando estrategia...', skill: 'monthly_strategy' },
    { id: 'calendar', label: 'Planificando calendario...', skill: 'content_calendar' },
    { id: 'hooks', label: 'Creando hooks...', skill: 'hook_variants' },
    { id: 'captions', label: 'Escribiendo copys...', skill: 'caption_long' },
    { id: 'visuals', label: 'Generando prompts visuales...', skill: 'visual_prompt_generator' },
    { id: 'qa', label: 'Verificando calidad...', skill: 'redundancy_check' },
]

export function GenerateMonthModal({
    isOpen,
    onClose,
    clientName,
    month,
    year
}: GenerateMonthModalProps) {
    const [status, setStatus] = useState<'idle' | 'running' | 'complete'>('idle')
    const [currentStep, setCurrentStep] = useState(0)
    const [piecesGenerated, setPiecesGenerated] = useState(0)

    const handleGenerate = async () => {
        setStatus('running')

        // Simulate generation steps
        for (let i = 0; i < steps.length; i++) {
            setCurrentStep(i)
            await new Promise(r => setTimeout(r, 1500 + Math.random() * 1000))

            // Simulate pieces being generated
            if (i >= 3) {
                setPiecesGenerated(prev => prev + Math.floor(5 + Math.random() * 5))
            }
        }

        setStatus('complete')
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Overlay */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={status === 'idle' ? onClose : undefined}
            />

            {/* Modal */}
            <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-border">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                                <Sparkles className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold">Generar Contenido</h2>
                                <p className="text-sm text-muted-foreground">
                                    {clientName} • {month} {year}
                                </p>
                            </div>
                        </div>
                        {status === 'idle' && (
                            <button
                                onClick={onClose}
                                className="p-2 rounded-lg hover:bg-secondary transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    {status === 'idle' && (
                        <div className="space-y-4">
                            <p className="text-muted-foreground">
                                La IA generará automáticamente:
                            </p>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 rounded-lg bg-secondary">
                                    <div className="text-2xl font-bold">30</div>
                                    <div className="text-sm text-muted-foreground">Piezas de contenido</div>
                                </div>
                                <div className="p-3 rounded-lg bg-secondary">
                                    <div className="text-2xl font-bold">4</div>
                                    <div className="text-sm text-muted-foreground">Semanas planificadas</div>
                                </div>
                            </div>
                            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                                <p className="text-sm">
                                    🎯 Incluye: Estrategia mensual, calendario, copys largos y cortos,
                                    CTAs, hashtags y prompts visuales para cada pieza.
                                </p>
                            </div>
                        </div>
                    )}

                    {status === 'running' && (
                        <div className="space-y-4">
                            {/* Progress */}
                            <div className="space-y-3">
                                {steps.map((step, i) => (
                                    <div
                                        key={step.id}
                                        className={`flex items-center gap-3 p-3 rounded-lg transition-all ${i < currentStep
                                                ? 'bg-emerald-500/10'
                                                : i === currentStep
                                                    ? 'bg-primary/10'
                                                    : 'bg-secondary/50'
                                            }`}
                                    >
                                        <div className="w-6 h-6 flex items-center justify-center">
                                            {i < currentStep ? (
                                                <CheckCircle className="w-5 h-5 text-emerald-500" />
                                            ) : i === currentStep ? (
                                                <Loader2 className="w-5 h-5 text-primary animate-spin" />
                                            ) : (
                                                <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                                            )}
                                        </div>
                                        <span className={`text-sm ${i <= currentStep ? 'text-foreground' : 'text-muted-foreground'}`}>
                                            {step.label}
                                        </span>
                                        {i === currentStep && (
                                            <span className="ml-auto text-xs text-primary animate-pulse">
                                                Procesando...
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Stats */}
                            {piecesGenerated > 0 && (
                                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground animate-pulse">
                                    <FileText className="w-4 h-4" />
                                    {piecesGenerated} piezas generadas
                                </div>
                            )}
                        </div>
                    )}

                    {status === 'complete' && (
                        <div className="text-center py-4">
                            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="w-8 h-8 text-emerald-500" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">¡Generación Completa!</h3>
                            <p className="text-muted-foreground mb-4">
                                Se generaron {piecesGenerated} piezas de contenido para {month} {year}
                            </p>
                            <div className="flex gap-3 justify-center">
                                <Button variant="outline" onClick={onClose}>
                                    Cerrar
                                </Button>
                                <Button>
                                    <Calendar className="w-4 h-4 mr-2" />
                                    Ver Calendario
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                {status === 'idle' && (
                    <div className="p-6 border-t border-border bg-secondary/30">
                        <Button className="w-full" size="lg" onClick={handleGenerate}>
                            <Sparkles className="w-4 h-4 mr-2" />
                            Generar Contenido del Mes
                        </Button>
                        <p className="text-xs text-center text-muted-foreground mt-2">
                            Tiempo estimado: 2-3 minutos
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
