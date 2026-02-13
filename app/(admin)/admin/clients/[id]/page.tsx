'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/badge'
import {
    ArrowLeft,
    Calendar,
    FileText,
    Sparkles,
    Download,
    Settings,
    Plus,
    ChevronRight,
    Palette,
    BookOpen,
    Image as ImageIcon,
    Loader2,
    X,
    Package,
    Check,
    Bot,
    Target
} from 'lucide-react'
import Link from 'next/link'
import { ClientOnboardingWizard } from '@/components/clients/onboarding-wizard'
import { MonthlyStrategyPlanner } from '@/components/months/strategy-planner'
import { AssetUploader } from '@/components/assets/asset-uploader'
import { JobMonitor } from '@/components/jobs/job-monitor'
import { BrandKitEditor } from '@/components/clients/brand-kit-editor'
import { KnowledgeBaseEditor } from '@/components/clients/knowledge-base-editor'

interface ContentMonth {
    id: string
    month: number
    year: number
    status: string
    _count?: { pieces: number }
}

interface Plan {
    id: string
    name: string
    postsPerMonth: number
    carouselsPerMonth: number
    reelsPerMonth: number
    storiesPerMonth: number
    workspaceId: string | null
    createdAt: Date
    totalPieces?: number
}

interface Client {
    id: string
    name: string
    slug: string
    industry: string | null
    description: string | null
    country: string | null
    city: string | null
    dialect: string | null
    plan: Plan | null
    brandKit: {
        tone: string
        primaryTone?: string | null
        brandPersonality?: string[]
        colorPalette?: { primary?: string[]; secondary?: string[] }
        guardrails?: string[]
        forbiddenWords?: string[]
        requiredHashtags?: string[]
        valueProposition?: string | null
        voiceDescription?: string | null
    } | null
    knowledgeBase: {
        about: string | null
        history?: string | null
        targetAudience: any
        targetAudiences?: any
        products: any
        competitors?: string[]
        customFields?: any
    } | null
    contentMonths: ContentMonth[]
    googleDriveFolderId?: string | null
    customPostsPerMonth?: number | null
    customCarouselsPerMonth?: number | null
    customReelsPerMonth?: number | null
    customStoriesPerMonth?: number | null
    _count: {
        assets: number
        users: number
    }
}

const MONTH_NAMES = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

const tabs = [
    { id: 'months', label: 'Meses de Contenido', icon: Calendar },
    { id: 'brandkit', label: 'Brand Kit', icon: Palette },
    { id: 'knowledge', label: 'Knowledge Base', icon: BookOpen },
    { id: 'assets', label: 'Assets', icon: ImageIcon },
]

export default function ClientDetailPage() {
    const params = useParams()
    const clientId = params.id as string

    const [client, setClient] = useState<Client | null>(null)
    const [plans, setPlans] = useState<Plan[]>([])
    const [assets, setAssets] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('months')
    const [showOnboarding, setShowOnboarding] = useState(false)
    const [showGenerateModal, setShowGenerateModal] = useState(false)
    const [showStrategyModal, setShowStrategyModal] = useState(false)
    const [createdMonthId, setCreatedMonthId] = useState<string | null>(null)
    const [showPlanModal, setShowPlanModal] = useState(false)
    const [generating, setGenerating] = useState(false)
    const [savingPlan, setSavingPlan] = useState(false)
    const [generateForm, setGenerateForm] = useState({
        month: new Date().getMonth() + 2, // Next month
        year: new Date().getFullYear(),
    })
    const [error, setError] = useState('')
    const [initializingDrive, setInitializingDrive] = useState(false)
    const [genProgress, setGenProgress] = useState(0)
    const [genStatus, setGenStatus] = useState('')
    const [genPieceCount, setGenPieceCount] = useState({ done: 0, total: 0 })
    const [deletingId, setDeletingId] = useState<string | null>(null)

    // Plan Overrides State
    const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)
    const [useOverrides, setUseOverrides] = useState(false)
    const [overrides, setOverrides] = useState({ posts: 0, carousels: 0, reels: 0, stories: 0 })

    useEffect(() => {
        fetchClient()
        fetchPlans()
        fetchAssets()
    }, [clientId])

    const fetchClient = async () => {
        try {
            const res = await fetch(`/api/clients/${clientId}`)
            if (res.ok) {
                const data = await res.json()
                setClient(data)
                // Init overrides form
                if (data.plan) {
                    setSelectedPlanId(data.plan.id)
                    // Check if client has ANY override set (even 0 is a valid override)
                    const hasCustom = data.customPostsPerMonth !== null || data.customCarouselsPerMonth !== null || data.customReelsPerMonth !== null || data.customStoriesPerMonth !== null
                    setUseOverrides(hasCustom)
                    setOverrides({
                        posts: data.customPostsPerMonth ?? data.plan.postsPerMonth,
                        carousels: data.customCarouselsPerMonth ?? data.plan.carouselsPerMonth,
                        reels: data.customReelsPerMonth ?? data.plan.reelsPerMonth,
                        stories: data.customStoriesPerMonth ?? data.plan.storiesPerMonth
                    })
                }
            }
        } catch (err) {
            console.error('Error fetching client:', err)
        } finally {
            setLoading(false)
        }
    }

    const fetchPlans = async () => {
        try {
            const res = await fetch('/api/plans')
            if (res.ok) {
                const data = await res.json()
                setPlans(data)
            }
        } catch (err) {
            console.error('Error fetching plans:', err)
        }
    }

    const fetchAssets = async () => {
        try {
            const res = await fetch(`/api/assets?clientId=${clientId}`)
            if (res.ok) {
                const data = await res.json()
                setAssets(data)
            }
        } catch (err) {
            console.error('Error fetching assets:', err)
        }
    }

    const handleInitDrive = async () => {
        setInitializingDrive(true)
        try {
            const res = await fetch(`/api/clients/${clientId}/init-drive`, {
                method: 'POST',
            })
            if (!res.ok) {
                const data = await res.json()
                if (data.code === 'NO_GOOGLE_CONNECTION' || res.status === 401) {
                    if (confirm('Para usar esta función necesitas conectar tu cuenta de Google. \n\n¿Quieres cerrar sesión y entrar con Google?')) {
                        window.location.href = '/api/auth/signin/google'
                    }
                    return
                }
                throw new Error(data.error || 'Error al inicializar Drive')
            }
            const data = await res.json()
            alert(`Google Drive inicializado: ${data.name}`)
            await fetchClient()
        } catch (err) {
            console.error(err)
            alert('Error al inicializar Google Drive')
        } finally {
            setInitializingDrive(false)
        }
    }

    const handleAssignPlan = async () => {
        if (!selectedPlanId) return
        setSavingPlan(true)
        try {
            const body: any = { planId: selectedPlanId }
            if (useOverrides) {
                body.customPostsPerMonth = Number(overrides.posts)
                body.customCarouselsPerMonth = Number(overrides.carousels)
                body.customReelsPerMonth = Number(overrides.reels)
                body.customStoriesPerMonth = Number(overrides.stories)
            } else {
                // Reset overrides if unchecked
                body.customPostsPerMonth = null
                body.customCarouselsPerMonth = null
                body.customReelsPerMonth = null
                body.customStoriesPerMonth = null
            }

            const res = await fetch(`/api/clients/${clientId}/plan`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            })
            if (res.ok) {
                await fetchClient()
                setShowPlanModal(false)
            }
        } catch (err) {
            console.error('Error assigning plan:', err)
        } finally {
            setSavingPlan(false)
        }
    }

    const handleCreateMonth = async () => {
        setError('')
        setGenerating(true)

        try {
            // First create the month
            const createRes = await fetch(`/api/clients/${clientId}/months`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(generateForm),
            })

            if (!createRes.ok) {
                const data = await createRes.json()
                setError(data.error)
                setGenerating(false)
                return
            }

            const newMonth = await createRes.json()
            setCreatedMonthId(newMonth.id)

            // Close generate modal and open strategy modal
            setShowGenerateModal(false)
            setShowStrategyModal(true)
            setGenerating(false)

        } catch (err) {
            setError('Error de conexión')
            setGenerating(false)
        }
    }

    const handleDeleteMonth = async (monthId: string, e: React.MouseEvent) => {
        setError('')
        e.preventDefault() // Prevent navigation
        e.stopPropagation() // Prevent event bubbling just in case

        if (!confirm('¿Seguro que quieres ELIMINAR este mes? Se borrará todo el contenido, estrategia y feedback permanentemente.')) return

        setDeletingId(monthId)
        try {
            const res = await fetch(`/api/months/${monthId}`, {
                method: 'DELETE',
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || 'Error al eliminar')
            }

            await fetchClient()
        } catch (err: any) {
            console.error('Error deleting month:', err)
            alert(err.message || 'Error al eliminar el mes')
        } finally {
            setDeletingId(null)
        }
    }

    const handleStrategyComplete = async () => {
        if (!createdMonthId) return
        setGenerating(true)
        setShowStrategyModal(false)
        setGenProgress(5)
        setGenStatus('Iniciando generación completa (Vercel Pro Mode)...')
        setGenPieceCount({ done: 0, total: 0 })

        try {
            // Fake progress animation for 30-45s
            const interval = setInterval(() => {
                setGenProgress((prev) => {
                    if (prev >= 90) return prev
                    return prev + (prev < 50 ? 5 : 2)
                })
                setGenStatus((prev) => {
                    if (prev.includes("Iniciando")) return "Escribiendo estrategia y pilares..."
                    if (prev.includes("Estrategia")) return "Diseñando piezas de contenido..."
                    if (prev.includes("Diseñando")) return "Redactando copys y hashtags..."
                    return prev
                })
            }, 2500)

            const res = await fetch(`/api/months/${createdMonthId}/generate`, {
                method: 'POST',
            })

            clearInterval(interval)

            if (!res.ok) {
                const errorText = await res.text()
                let errorMsg = `Error ${res.status}: ${res.statusText}`
                try {
                    const errData = JSON.parse(errorText)
                    errorMsg = errData.error || errorMsg
                } catch {
                    console.error("Non-JSON error response:", errorText.slice(0, 200))
                }
                throw new Error(errorMsg)
            }

            const data = await res.json()

            setGenProgress(100)
            setGenStatus(`🎉 ¡Contenido generado! (${data.count || 'varias'} piezas)`)
            setCreatedMonthId(null)
            await fetchClient()

        } catch (error: any) {
            console.error(error)
            const errorMsg = error.message || 'Error fatal al generar'
            setError(errorMsg)
            setGenStatus(`❌ ${errorMsg.slice(0, 50)}...`) // Show summary in overlay
        } finally {
            setTimeout(() => setGenerating(false), 4000) // Give time to read
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    if (!client) {
        return (
            <div className="text-center py-12">
                <h2 className="text-xl font-semibold mb-2">Cliente no encontrado</h2>
                <Link href="/admin/clients">
                    <Button variant="outline">Volver a Clientes</Button>
                </Link>
            </div>
        )
    }

    const initials = client.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    const totalPieces = client.contentMonths.reduce((acc, m) => acc + (m._count?.pieces || 0), 0)

    // Calculate pieces per month considering overrides
    const piecesPerMonth = client.plan ? (
        (client.customPostsPerMonth ?? client.plan.postsPerMonth) +
        (client.customCarouselsPerMonth ?? client.plan.carouselsPerMonth) +
        (client.customReelsPerMonth ?? client.plan.reelsPerMonth) +
        (client.customStoriesPerMonth ?? client.plan.storiesPerMonth)
    ) : 0

    return (
        <div className="space-y-6">
            {showOnboarding ? (
                <div>
                    <Button
                        variant="ghost"
                        onClick={() => setShowOnboarding(false)}
                        className="mb-4"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Volver al Dashboard
                    </Button>
                    <ClientOnboardingWizard
                        clientId={clientId}
                        initialData={{
                            ...client.brandKit,
                            ...client.knowledgeBase,
                            country: client.country,
                            city: client.city,
                            dialect: client.dialect,
                        }}
                        onComplete={() => {
                            setShowOnboarding(false)
                            fetchClient()
                        }}
                    />
                </div>
            ) : (
                <>
                    {/* Back Button */}
                    <Link
                        href="/admin/clients"
                        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Volver a Clientes
                    </Link>

                    {/* Global Error Banner */}
                    {/* Global Error Banner */}
                    {error && !showGenerateModal && !showStrategyModal && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-lg flex items-center justify-between mb-4 animate-in fade-in slide-in-from-top-2">
                            <div className="flex items-center gap-2">
                                <X className="w-5 h-5" />
                                <span className="font-medium">{error}</span>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => setError('')} className="hover:bg-red-500/10 text-red-500">
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    )}

                    {/* Client Header */}
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white text-xl font-bold">
                                {initials}
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold">{client.name}</h1>
                                <div className="flex items-center gap-3 mt-1">
                                    <span className="text-muted-foreground">{client.industry || 'Sin industria'}</span>
                                    <button
                                        onClick={() => setShowPlanModal(true)}
                                        className={`px-2 py-1 rounded-full text-xs font-medium ${client.plan
                                            ? 'bg-primary/10 text-primary hover:bg-primary/20'
                                            : 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20'
                                            } transition-colors`}
                                    >
                                        {client.plan ? `Plan ${client.plan.name}` : '⚠️ Sin plan asignado'}
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => setShowPlanModal(true)}>
                                <Package className="w-4 h-4 mr-2" />
                                Cambiar Plan
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => setShowOnboarding(true)}>
                                <Bot className="w-4 h-4 mr-2" />
                                Configurar Agente
                            </Button>
                            {!client.googleDriveFolderId && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleInitDrive}
                                    disabled={initializingDrive}
                                    className="border-blue-500/30 text-blue-600 hover:bg-blue-500/5"
                                >
                                    {initializingDrive ? (
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    ) : (
                                        <ImageIcon className="w-4 h-4 mr-2" />
                                    )}
                                    Vincular Drive
                                </Button>
                            )}
                            {client.googleDriveFolderId && (
                                <Link href={`https://drive.google.com/drive/folders/${client.googleDriveFolderId}`} target="_blank">
                                    <Button variant="outline" size="sm" className="border-emerald-500/30 text-emerald-600">
                                        <ImageIcon className="w-4 h-4 mr-2" />
                                        Ver en Drive
                                    </Button>
                                </Link>
                            )}
                            <Button
                                size="sm"
                                onClick={() => setShowGenerateModal(true)}
                                disabled={!client.plan}
                                title={!client.plan ? 'Asigna un plan primero' : ''}
                            >
                                <Sparkles className="w-4 h-4 mr-2" />
                                Generar Nuevo Mes
                            </Button>
                        </div>
                    </div>

                    {/* Plan Stats */}
                    {client.plan && (
                        <Card className="border-primary/20 bg-primary/5">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Package className="w-5 h-5 text-primary" />
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold">Plan {client.plan.name}</span>
                                                {(client.customPostsPerMonth !== null || client.customCarouselsPerMonth !== null) && (
                                                    <span className="text-xs bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded border border-amber-500/20">
                                                        Personalizado
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-muted-foreground text-sm">
                                                • {piecesPerMonth} piezas/mes
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex gap-4 text-sm">
                                        <span className={`px-2 py-1 bg-background rounded ${client.customPostsPerMonth !== null ? 'text-amber-500 border border-amber-500/20' : ''}`}>
                                            {client.customPostsPerMonth ?? client.plan.postsPerMonth} Posts
                                        </span>
                                        <span className={`px-2 py-1 bg-background rounded ${client.customCarouselsPerMonth !== null ? 'text-amber-500 border border-amber-500/20' : ''}`}>
                                            {client.customCarouselsPerMonth ?? client.plan.carouselsPerMonth} Carruseles
                                        </span>
                                        <span className={`px-2 py-1 bg-background rounded ${client.customReelsPerMonth !== null ? 'text-amber-500 border border-amber-500/20' : ''}`}>
                                            {client.customReelsPerMonth ?? client.plan.reelsPerMonth} Reels
                                        </span>
                                        <span className={`px-2 py-1 bg-background rounded ${client.customStoriesPerMonth !== null ? 'text-amber-500 border border-amber-500/20' : ''}`}>
                                            {client.customStoriesPerMonth ?? client.plan.storiesPerMonth} Stories
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Stats Row */}
                    <div className="grid grid-cols-3 gap-4">
                        <Card>
                            <CardContent className="p-4 flex items-center gap-4">
                                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <Calendar className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold">{client.contentMonths.length}</div>
                                    <div className="text-sm text-muted-foreground">Meses</div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4 flex items-center gap-4">
                                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <FileText className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold">{totalPieces}</div>
                                    <div className="text-sm text-muted-foreground">Piezas Totales</div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4 flex items-center gap-4">
                                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                    <span className="text-emerald-500 font-bold">%</span>
                                </div>
                                <div>
                                    <div className="text-2xl font-bold">-</div>
                                    <div className="text-sm text-muted-foreground">Tasa Aprobación</div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Tabs */}
                    <div className="border-b border-border">
                        <nav className="flex gap-1">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id
                                        ? 'border-primary text-foreground'
                                        : 'border-transparent text-muted-foreground hover:text-foreground'
                                        }`}
                                >
                                    <tab.icon className="w-4 h-4" />
                                    {tab.label}
                                </button>
                            ))}
                        </nav>
                    </div>

                    {/* Tab Content */}
                    {activeTab === 'months' && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold">Historial de Meses</h2>
                            </div>

                            {/* Months List */}
                            {client.contentMonths.length === 0 ? (
                                <Card className="p-8 text-center">
                                    <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                                    <h3 className="text-lg font-semibold mb-2">Sin meses de contenido</h3>
                                    <p className="text-muted-foreground mb-4">
                                        Genera tu primer mes de contenido con IA
                                    </p>
                                    <Button onClick={() => setShowGenerateModal(true)}>
                                        <Sparkles className="w-4 h-4 mr-2" />
                                        Generar Primer Mes
                                    </Button>
                                </Card>
                            ) : (
                                <div className="space-y-3">
                                    {client.contentMonths.map((month) => (
                                        <Card key={month.id} className="hover:border-primary/50 transition-all group relative overflow-hidden">
                                            {/* Full card clickable link */}
                                            <Link
                                                href={`/admin/clients/${client.id}/months/${month.id}`}
                                                className="absolute inset-0 z-10 focus:outline-none"
                                            >
                                                <span className="sr-only">Ver mes {MONTH_NAMES[month.month]}</span>
                                            </Link>

                                            <CardContent className="p-4 flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                                                        <Calendar className="w-5 h-5 text-muted-foreground" />
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold group-hover:text-primary transition-colors">
                                                            {MONTH_NAMES[month.month]} {month.year}
                                                        </div>
                                                        <div className="text-sm text-muted-foreground">
                                                            {month._count?.pieces || 0} piezas
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <StatusBadge status={month.status} />

                                                    {/* Actions - elevated z-index to be clickable above the link */}
                                                    <div className="relative z-20 flex items-center gap-1">
                                                        {month.status === 'EXPORTED' && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={(e) => e.preventDefault()}
                                                            >
                                                                <Download className="w-4 h-4" />
                                                            </Button>
                                                        )}
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            disabled={deletingId === month.id}
                                                            className={`h-8 w-8 ${month.status === 'GENERATING'
                                                                ? "text-red-600 bg-red-100 hover:bg-red-200 dark:text-red-400 dark:bg-red-900/20 dark:hover:bg-red-900/40"
                                                                : "text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                                                                }`}
                                                            onClick={(e) => handleDeleteMonth(month.id, e)}
                                                            title={month.status === 'GENERATING' ? "Eliminar para reiniciar" : "Eliminar mes"}
                                                        >
                                                            {deletingId === month.id ? (
                                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                            ) : (
                                                                <X className="w-4 h-4" />
                                                            )}
                                                        </Button>
                                                    </div>

                                                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'brandkit' && (
                        <BrandKitEditor
                            clientId={clientId}
                            initialData={{
                                tone: client.brandKit?.primaryTone || client.brandKit?.tone || '',
                                personality: client.brandKit?.brandPersonality || [],
                                guardrails: client.brandKit?.guardrails || [],
                                forbiddenWords: client.brandKit?.forbiddenWords || [],
                                requiredHashtags: client.brandKit?.requiredHashtags || [],
                                samplePhrases: client.brandKit?.voiceDescription ? client.brandKit.voiceDescription.split('\n').filter(Boolean) : [],
                            }}
                            onSave={fetchClient}
                        />
                    )}

                    {activeTab === 'knowledge' && (
                        <KnowledgeBaseEditor
                            clientId={clientId}
                            initialData={{
                                about: client.knowledgeBase?.about || '',
                                mission: client.knowledgeBase?.history || '',
                                uniqueValue: (client.knowledgeBase?.customFields as any)?.uniqueValue || '',
                                targetAudience: client.knowledgeBase?.targetAudiences as any || [],
                                products: client.knowledgeBase?.products as any || [],
                                competitors: client.knowledgeBase?.competitors || [],
                            }}
                            onSave={fetchClient}
                        />
                    )}

                    {activeTab === 'assets' && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Assets ({assets.length})</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <AssetUploader
                                    clientId={clientId}
                                    assets={assets}
                                    onUploadComplete={fetchAssets}
                                    onDelete={() => fetchAssets()}
                                />
                            </CardContent>
                        </Card>
                    )}

                    {/* Generate Month Modal */}
                    {showGenerateModal && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                            <div className="bg-background border border-border rounded-2xl w-full max-w-md shadow-xl">
                                <div className="flex items-center justify-between p-6 border-b border-border">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                                            <Sparkles className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-semibold">Generar Mes con IA</h2>
                                            <p className="text-sm text-muted-foreground">Content Wizard creará todo el contenido</p>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={() => setShowGenerateModal(false)} disabled={generating}>
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                                <div className="p-6 space-y-4">
                                    {error && (
                                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
                                            {error}
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-2">Mes</label>
                                            <select
                                                value={generateForm.month}
                                                onChange={(e) => setGenerateForm({ ...generateForm, month: Number(e.target.value) })}
                                                className="w-full px-4 py-2 bg-secondary border border-border rounded-lg"
                                                disabled={generating}
                                            >
                                                {MONTH_NAMES.slice(1).map((name, i) => (
                                                    <option key={i + 1} value={i + 1}>{name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-2">Año</label>
                                            <select
                                                value={generateForm.year}
                                                onChange={(e) => setGenerateForm({ ...generateForm, year: Number(e.target.value) })}
                                                className="w-full px-4 py-2 bg-secondary border border-border rounded-lg"
                                                disabled={generating}
                                            >
                                                <option value={2025}>2025</option>
                                                <option value={2026}>2026</option>
                                                <option value={2027}>2027</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                                        <h4 className="font-medium mb-2">Lo que se generará:</h4>
                                        <ul className="text-sm text-muted-foreground space-y-1">
                                            <li>• Estrategia mensual con pilares de contenido</li>
                                            <li>• {piecesPerMonth > 0 ? `~${piecesPerMonth}` : 'Varias'} piezas de contenido (posts, carruseles, reels, stories)</li>
                                            <li>• Hooks, captions, CTAs y hashtags para cada pieza</li>
                                            <li>• Conceptos visuales para el diseñador</li>
                                        </ul>
                                    </div>

                                    <div className="flex gap-3 pt-4">
                                        <Button
                                            variant="outline"
                                            onClick={() => setShowGenerateModal(false)}
                                            className="flex-1"
                                            disabled={generating}
                                        >
                                            Cancelar
                                        </Button>
                                        <Button
                                            onClick={handleCreateMonth}
                                            disabled={generating}
                                            className="flex-1"
                                        >
                                            {generating ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                    Generando...
                                                </>
                                            ) : (
                                                <>
                                                    Siguiente: Estrategia
                                                    <ChevronRight className="w-4 h-4 ml-2" />
                                                </>
                                            )}
                                        </Button>
                                    </div>

                                    {generating && (
                                        <div className="text-center text-sm text-muted-foreground">
                                            Creando borrador...
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Strategy Planner Modal */}
                    {showStrategyModal && createdMonthId && (
                        <div className="fixed inset-0 bg-background z-50 p-4 overflow-y-auto">
                            <div className="max-w-4xl mx-auto pt-8">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
                                            <Target className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold">Definir Estrategia Mensual</h2>
                                            <p className="text-muted-foreground">Antes de generar, define el rumbo del mes.</p>
                                        </div>
                                    </div>
                                    <Button variant="ghost" onClick={() => setShowStrategyModal(false)}>
                                        Cancelar
                                    </Button>
                                </div>

                                <MonthlyStrategyPlanner
                                    monthId={createdMonthId}
                                    monthName={`${MONTH_NAMES[generateForm.month]} ${generateForm.year}`}
                                    onComplete={handleStrategyComplete}
                                />
                            </div>
                        </div>
                    )}

                    {/* Full Screen Loading Overlay when generating */}
                    {generating && !showGenerateModal && !showStrategyModal && (
                        <div className="fixed inset-0 bg-background/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
                            <div className="w-full max-w-md p-8">
                                <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 mx-auto animate-pulse">
                                    <Sparkles className="w-10 h-10 text-primary" />
                                </div>
                                <h2 className="text-2xl font-bold text-center mb-2">Content Wizard trabajando...</h2>

                                <div className="w-full bg-secondary rounded-full h-3 mb-3 overflow-hidden">
                                    <div
                                        className="bg-primary h-full rounded-full transition-all duration-500 ease-out"
                                        style={{ width: `${genProgress}%` }}
                                    />
                                </div>

                                <div className="flex justify-between text-sm text-muted-foreground mb-4">
                                    <span>{genStatus}</span>
                                    <span className="font-medium">{genProgress}%</span>
                                </div>

                                {genPieceCount.total > 0 && (
                                    <div className="text-center text-sm text-muted-foreground">
                                        {genPieceCount.done} de {genPieceCount.total} piezas generadas
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                </>
            )}

            {/* Plan Selection Modal */}
            {showPlanModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-background border border-border rounded-2xl w-full max-w-2xl shadow-xl">
                        <div className="flex items-center justify-between p-6 border-b border-border">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                                    <Package className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-semibold">Seleccionar Plan</h2>
                                    <p className="text-sm text-muted-foreground">Define cuántas piezas se generarán por mes</p>
                                </div>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => setShowPlanModal(false)} disabled={savingPlan}>
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                        <div className="p-6">
                            <div className="mb-6">
                                <h3 className="text-sm font-medium mb-3 text-muted-foreground">1. Elige un Plan Base</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {plans.map((plan) => (
                                        <div
                                            key={plan.id}
                                            onClick={() => {
                                                setSelectedPlanId(plan.id)
                                                // If overrides are NOT active, update the preview values to match the selected plan
                                                if (!useOverrides) {
                                                    setOverrides({
                                                        posts: plan.postsPerMonth,
                                                        carousels: plan.carouselsPerMonth,
                                                        reels: plan.reelsPerMonth,
                                                        stories: plan.storiesPerMonth
                                                    })
                                                }
                                            }}
                                            className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedPlanId === plan.id
                                                ? 'border-primary bg-primary/5'
                                                : 'border-border hover:border-primary/50'
                                                }`}
                                        >
                                            {selectedPlanId === plan.id && (
                                                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                                                    <Check className="w-3 h-3 text-white" />
                                                </div>
                                            )}
                                            <h3 className={`text-lg font-bold mb-1 ${plan.name === 'Pro' ? 'text-amber-500' :
                                                plan.name === 'Growth' ? 'text-primary' : 'text-foreground'
                                                }`}>
                                                {plan.name}
                                            </h3>
                                            <div className="text-sm text-muted-foreground mb-3">
                                                {plan.workspaceId ? 'Personalizado' : 'Sistema'}
                                            </div>

                                            <div className="space-y-1 text-xs text-muted-foreground">
                                                <div className="flex justify-between"><span>Posts</span> <b>{plan.postsPerMonth}</b></div>
                                                <div className="flex justify-between"><span>Carruseles</span> <b>{plan.carouselsPerMonth}</b></div>
                                                <div className="flex justify-between"><span>Reels</span> <b>{plan.reelsPerMonth}</b></div>
                                                <div className="flex justify-between"><span>Stories</span> <b>{plan.storiesPerMonth}</b></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="mb-6 p-4 bg-secondary/30 rounded-xl border border-border">
                                <div className="flex items-center gap-2 mb-4">
                                    <input
                                        type="checkbox"
                                        id="useOverrides"
                                        className="rounded border-gray-300 text-primary focus:ring-primary"
                                        checked={useOverrides}
                                        onChange={(e) => setUseOverrides(e.target.checked)}
                                    />
                                    <label htmlFor="useOverrides" className="text-sm font-medium cursor-pointer select-none">
                                        Personalizar cantidades para este cliente (Override)
                                    </label>
                                </div>

                                {useOverrides && (
                                    <div className="grid grid-cols-4 gap-4 animate-in slide-in-from-top-2 fade-in">
                                        <div>
                                            <label className="text-xs text-muted-foreground block mb-1">Posts</label>
                                            <input type="number" className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                                                value={overrides.posts} onChange={e => setOverrides({ ...overrides, posts: Number(e.target.value) })} />
                                        </div>
                                        <div>
                                            <label className="text-xs text-muted-foreground block mb-1">Carruseles</label>
                                            <input type="number" className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                                                value={overrides.carousels} onChange={e => setOverrides({ ...overrides, carousels: Number(e.target.value) })} />
                                        </div>
                                        <div>
                                            <label className="text-xs text-muted-foreground block mb-1">Reels</label>
                                            <input type="number" className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                                                value={overrides.reels} onChange={e => setOverrides({ ...overrides, reels: Number(e.target.value) })} />
                                        </div>
                                        <div>
                                            <label className="text-xs text-muted-foreground block mb-1">Stories</label>
                                            <input type="number" className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                                                value={overrides.stories} onChange={e => setOverrides({ ...overrides, stories: Number(e.target.value) })} />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end gap-3">
                                <Button variant="ghost" onClick={() => setShowPlanModal(false)}>Cancelar</Button>
                                <Button onClick={handleAssignPlan} disabled={savingPlan || !selectedPlanId}>
                                    {savingPlan ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                                    Guardar Cambios
                                </Button>
                            </div>
                            {savingPlan && (
                                <div className="mt-4 text-center">
                                    <Loader2 className="w-5 h-5 animate-spin inline-block mr-2" />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Full Screen Generation Overlay */}
            {generating && !showGenerateModal && !showStrategyModal && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4">
                    <div className="w-full max-w-md bg-card border border-border rounded-xl shadow-2xl p-8 text-center space-y-6 animate-in zoom-in-95 fade-in duration-300">
                        <div className="relative w-20 h-20 mx-auto">
                            <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
                            <div
                                className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"
                                style={{ animationDuration: '2s' }}
                            />
                            <div className="absolute inset-0 flex items-center justify-center font-bold text-xl">
                                {genProgress}%
                            </div>
                        </div>

                        <div>
                            <h3 className="text-xl font-bold mb-2">Generando Contenido</h3>
                            <p className="text-muted-foreground animate-pulse">
                                {genStatus || 'Iniciando...'}
                            </p>
                            {genPieceCount.total > 0 && (
                                <p className="text-sm text-muted-foreground mt-2">
                                    Pieza {genPieceCount.done} de {genPieceCount.total}
                                </p>
                            )}
                        </div>

                        <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                            <div
                                className="bg-primary h-full transition-all duration-500 ease-out"
                                style={{ width: `${genProgress}%` }}
                            />
                        </div>

                        <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                            Esto puede tomar unos momentos. Por favor no cierres la pestaña.
                        </p>
                    </div>
                </div>
            )}
        </div>
    )
}
