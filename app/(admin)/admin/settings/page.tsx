'use client'

import { useState, useEffect } from 'react'
import { Settings, Key, Building2, CreditCard, Check, X, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react'

interface SettingsData {
    workspace: {
        id: string
        name: string
        slug: string
    }
    settings: {
        tier: string
        maxClients: number
        apiKeys: Record<string, string>
        hasAnthropicKey: boolean
        hasOpenAIKey: boolean
    }
}

export default function SettingsPage() {
    const [data, setData] = useState<SettingsData | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    // Form state
    const [workspaceName, setWorkspaceName] = useState('')
    const [anthropicKey, setAnthropicKey] = useState('')
    const [openaiKey, setOpenaiKey] = useState('')
    const [showAnthropicKey, setShowAnthropicKey] = useState(false)
    const [showOpenaiKey, setShowOpenaiKey] = useState(false)

    useEffect(() => {
        fetchSettings()
    }, [])

    async function fetchSettings() {
        try {
            const res = await fetch('/api/settings')
            if (!res.ok) throw new Error('Error al cargar settings')
            const json = await res.json()
            setData(json)
            setWorkspaceName(json.workspace.name)
            setAnthropicKey(json.settings.apiKeys.anthropic || '')
            setOpenaiKey(json.settings.apiKeys.openai || '')
        } catch (err) {
            setError('Error al cargar configuración')
        } finally {
            setLoading(false)
        }
    }

    async function handleSaveKeys() {
        setSaving(true)
        setError('')
        setSuccess('')

        try {
            const apiKeys: Record<string, string> = {}
            if (anthropicKey && !anthropicKey.includes('••••')) {
                apiKeys.anthropic = anthropicKey
            }
            if (openaiKey && !openaiKey.includes('••••')) {
                apiKeys.openai = openaiKey
            }

            const res = await fetch('/api/settings', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ apiKeys }),
            })

            if (!res.ok) throw new Error('Error al guardar')

            setSuccess('API Keys guardadas correctamente')
            fetchSettings() // Refresh to get masked keys
        } catch (err) {
            setError('Error al guardar API Keys')
        } finally {
            setSaving(false)
        }
    }

    async function handleRemoveKey(provider: string) {
        if (!confirm(`¿Eliminar la API Key de ${provider}?`)) return

        try {
            const res = await fetch(`/api/settings?provider=${provider}`, {
                method: 'DELETE',
            })
            if (!res.ok) throw new Error('Error al eliminar')

            setSuccess(`API Key de ${provider} eliminada`)
            fetchSettings()
        } catch (err) {
            setError('Error al eliminar API Key')
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            </div>
        )
    }

    const tierConfig = {
        FREE: { label: 'Free', color: 'gray', maxClients: 2 },
        PRO: { label: 'Pro', color: 'purple', maxClients: 5 },
        AGENCY: { label: 'Agency', color: 'blue', maxClients: 12 },
    }

    const currentTier = tierConfig[data?.settings.tier as keyof typeof tierConfig] || tierConfig.FREE

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                    <Settings className="w-7 h-7" />
                    Configuración
                </h1>
                <p className="text-gray-400 mt-1">Gestiona tu workspace y API Keys</p>
            </div>

            {/* Alerts */}
            {error && (
                <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
                    <AlertCircle className="w-5 h-5" />
                    <p>{error}</p>
                    <button onClick={() => setError('')} className="ml-auto">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}
            {success && (
                <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400">
                    <Check className="w-5 h-5" />
                    <p>{success}</p>
                    <button onClick={() => setSuccess('')} className="ml-auto">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Plan Section */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                    <CreditCard className="w-5 h-5 text-purple-400" />
                    <h2 className="text-lg font-semibold text-white">Tu Plan</h2>
                </div>

                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-3">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium bg-${currentTier.color}-500/20 text-${currentTier.color}-400 border border-${currentTier.color}-500/30`}>
                                {currentTier.label}
                            </span>
                            <span className="text-gray-400">
                                Hasta {data?.settings.maxClients || 2} clientes
                            </span>
                        </div>
                        {data?.settings.tier === 'FREE' && (
                            <p className="text-sm text-gray-500 mt-2">
                                Usa tu propia API Key para generaciones ilimitadas
                            </p>
                        )}
                    </div>
                    {data?.settings.tier === 'FREE' && (
                        <button className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity">
                            Upgrade
                        </button>
                    )}
                </div>
            </div>

            {/* Workspace Section */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                    <Building2 className="w-5 h-5 text-purple-400" />
                    <h2 className="text-lg font-semibold text-white">Workspace</h2>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Nombre del Workspace
                        </label>
                        <div className="flex gap-2 max-w-md">
                            <input
                                type="text"
                                value={workspaceName}
                                onChange={(e) => setWorkspaceName(e.target.value)}
                                className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                            <button
                                onClick={async () => {
                                    setSaving(true)
                                    setError('')
                                    try {
                                        const res = await fetch('/api/settings', {
                                            method: 'PATCH',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ name: workspaceName }),
                                        })
                                        if (!res.ok) throw new Error('Error al guardar')
                                        setSuccess('Nombre actualizado')
                                    } catch {
                                        setError('Error al guardar nombre')
                                    } finally {
                                        setSaving(false)
                                    }
                                }}
                                disabled={saving || workspaceName === data?.workspace.name}
                                className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Guardar
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* API Keys Section */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-2">
                    <Key className="w-5 h-5 text-purple-400" />
                    <h2 className="text-lg font-semibold text-white">API Keys</h2>
                </div>
                <p className="text-sm text-gray-400 mb-6">
                    Configura tus propias API Keys para usar la generación de contenido con IA.
                    Las keys se guardan de forma encriptada.
                </p>

                <div className="space-y-6">
                    {/* Anthropic */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-medium text-gray-300">
                                Anthropic (Claude)
                            </label>
                            {data?.settings.hasAnthropicKey && (
                                <span className="flex items-center gap-1.5 text-xs text-green-400">
                                    <Check className="w-3.5 h-3.5" />
                                    Configurada
                                </span>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <div className="relative flex-1 max-w-md">
                                <input
                                    type={showAnthropicKey ? 'text' : 'password'}
                                    value={anthropicKey}
                                    onChange={(e) => setAnthropicKey(e.target.value)}
                                    placeholder="sk-ant-api03-..."
                                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowAnthropicKey(!showAnthropicKey)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                                >
                                    {showAnthropicKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            {data?.settings.hasAnthropicKey && (
                                <button
                                    onClick={() => handleRemoveKey('anthropic')}
                                    className="px-3 py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1.5">
                            Obtén tu key en{' '}
                            <a href="https://console.anthropic.com/" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">
                                console.anthropic.com
                            </a>
                        </p>
                    </div>

                    {/* OpenAI */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-medium text-gray-300">
                                OpenAI (GPT)
                            </label>
                            {data?.settings.hasOpenAIKey && (
                                <span className="flex items-center gap-1.5 text-xs text-green-400">
                                    <Check className="w-3.5 h-3.5" />
                                    Configurada
                                </span>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <div className="relative flex-1 max-w-md">
                                <input
                                    type={showOpenaiKey ? 'text' : 'password'}
                                    value={openaiKey}
                                    onChange={(e) => setOpenaiKey(e.target.value)}
                                    placeholder="sk-proj-..."
                                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowOpenaiKey(!showOpenaiKey)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                                >
                                    {showOpenaiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            {data?.settings.hasOpenAIKey && (
                                <button
                                    onClick={() => handleRemoveKey('openai')}
                                    className="px-3 py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1.5">
                            Obtén tu key en{' '}
                            <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">
                                platform.openai.com
                            </a>
                        </p>
                    </div>

                    {/* Save Button */}
                    <div className="pt-4">
                        <button
                            onClick={handleSaveKeys}
                            disabled={saving}
                            className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {saving ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Check className="w-4 h-4" />
                            )}
                            Guardar API Keys
                        </button>
                    </div>
                </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                <h3 className="text-sm font-medium text-blue-300 mb-2">💡 ¿Cómo funciona?</h3>
                <p className="text-sm text-gray-400">
                    Cuando generas contenido, usamos tu API Key para conectar con Claude o GPT.
                    Tú pagas directamente a Anthropic/OpenAI por el uso. Esto te da control total
                    sobre los costos y sin límites de generación.
                </p>
            </div>
        </div>
    )
}
