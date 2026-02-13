'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
    Search,
    Command,
    ArrowRight,
    Users,
    Calendar,
    FileText,
    Settings,
    Home,
    Sparkles,
    Download
} from 'lucide-react'

interface CommandItem {
    id: string
    title: string
    description?: string
    icon: React.ElementType
    category: string
    action: () => void
    keywords?: string[]
}

export function CommandPalette() {
    const [isOpen, setIsOpen] = useState(false)
    const [query, setQuery] = useState('')
    const [selectedIndex, setSelectedIndex] = useState(0)
    const inputRef = useRef<HTMLInputElement>(null)
    const router = useRouter()

    // Command items
    const commands: CommandItem[] = [
        // Navigation
        {
            id: 'nav-dashboard',
            title: 'Ir a Dashboard',
            description: 'Panel principal',
            icon: Home,
            category: 'Navegación',
            action: () => router.push('/admin'),
            keywords: ['home', 'inicio', 'panel'],
        },
        {
            id: 'nav-clients',
            title: 'Ver Clientes',
            description: 'Lista de todos los clientes',
            icon: Users,
            category: 'Navegación',
            action: () => router.push('/admin'),
            keywords: ['brands', 'marcas'],
        },
        // Actions
        {
            id: 'action-new-client',
            title: 'Nuevo Cliente',
            description: 'Crear un cliente nuevo',
            icon: Users,
            category: 'Acciones',
            action: () => {
                // Could open a modal or navigate
                router.push('/admin')
            },
            keywords: ['crear', 'agregar', 'add'],
        },
        {
            id: 'action-generate',
            title: 'Generar Contenido',
            description: 'Iniciar generación con IA',
            icon: Sparkles,
            category: 'Acciones',
            action: () => {
                router.push('/admin')
            },
            keywords: ['ai', 'ia', 'crear', 'wizard'],
        },
        {
            id: 'action-export',
            title: 'Exportar Mes',
            description: 'Descargar contenido del mes',
            icon: Download,
            category: 'Acciones',
            action: () => {
                router.push('/admin')
            },
            keywords: ['download', 'descargar', 'csv', 'json'],
        },
        // Quick access
        {
            id: 'quick-calendar',
            title: 'Vista Calendario',
            icon: Calendar,
            category: 'Vistas',
            action: () => router.push('/admin'),
            keywords: ['month', 'mes'],
        },
        {
            id: 'quick-pieces',
            title: 'Buscar Pieza',
            icon: FileText,
            category: 'Vistas',
            action: () => router.push('/admin'),
            keywords: ['content', 'post', 'contenido'],
        },
        // Settings
        {
            id: 'settings',
            title: 'Configuración',
            icon: Settings,
            category: 'Sistema',
            action: () => router.push('/admin'),
            keywords: ['ajustes', 'config'],
        },
    ]

    // Filter commands based on query
    const filteredCommands = query
        ? commands.filter((cmd) => {
            const searchText = [
                cmd.title,
                cmd.description || '',
                ...(cmd.keywords || []),
            ].join(' ').toLowerCase()
            return searchText.includes(query.toLowerCase())
        })
        : commands

    // Group by category
    const groupedCommands = filteredCommands.reduce((acc, cmd) => {
        if (!acc[cmd.category]) acc[cmd.category] = []
        acc[cmd.category].push(cmd)
        return acc
    }, {} as Record<string, CommandItem[]>)

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Open with Cmd/Ctrl + K
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault()
                setIsOpen(true)
            }

            // Close with Escape
            if (e.key === 'Escape') {
                setIsOpen(false)
                setQuery('')
                setSelectedIndex(0)
            }
        }

        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [])

    // Focus input when opened
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus()
        }
    }, [isOpen])

    // Keyboard navigation
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        const flatCommands = Object.values(groupedCommands).flat()

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault()
                setSelectedIndex((prev) =>
                    prev < flatCommands.length - 1 ? prev + 1 : 0
                )
                break
            case 'ArrowUp':
                e.preventDefault()
                setSelectedIndex((prev) =>
                    prev > 0 ? prev - 1 : flatCommands.length - 1
                )
                break
            case 'Enter':
                e.preventDefault()
                const selectedCommand = flatCommands[selectedIndex]
                if (selectedCommand) {
                    selectedCommand.action()
                    setIsOpen(false)
                    setQuery('')
                    setSelectedIndex(0)
                }
                break
        }
    }, [groupedCommands, selectedIndex])

    if (!isOpen) return null

    let flatIndex = -1

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
                onClick={() => {
                    setIsOpen(false)
                    setQuery('')
                    setSelectedIndex(0)
                }}
            />

            {/* Command Palette */}
            <div className="fixed inset-x-0 top-[20%] z-50 mx-auto w-full max-w-xl">
                <div className="bg-background/80 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden">
                    {/* Search Input */}
                    <div className="flex items-center px-4 border-b border-border">
                        <Search className="w-5 h-5 text-muted-foreground" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={(e) => {
                                setQuery(e.target.value)
                                setSelectedIndex(0)
                            }}
                            onKeyDown={handleKeyDown}
                            placeholder="Buscar comandos..."
                            className="flex-1 bg-transparent px-4 py-4 text-base outline-none placeholder:text-muted-foreground"
                        />
                        <kbd className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded">
                            ESC
                        </kbd>
                    </div>

                    {/* Results */}
                    <div className="max-h-80 overflow-y-auto p-2">
                        {Object.entries(groupedCommands).map(([category, items]) => (
                            <div key={category} className="mb-2">
                                <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                                    {category}
                                </div>
                                {items.map((cmd) => {
                                    flatIndex++
                                    const isSelected = flatIndex === selectedIndex
                                    const Icon = cmd.icon

                                    return (
                                        <button
                                            key={cmd.id}
                                            onClick={() => {
                                                cmd.action()
                                                setIsOpen(false)
                                                setQuery('')
                                                setSelectedIndex(0)
                                            }}
                                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${isSelected
                                                ? 'bg-primary text-white'
                                                : 'hover:bg-secondary text-foreground'
                                                }`}
                                        >
                                            <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-muted-foreground'}`} />
                                            <div className="flex-1 text-left">
                                                <div className="text-sm font-medium">{cmd.title}</div>
                                                {cmd.description && (
                                                    <div className={`text-xs ${isSelected ? 'text-white/70' : 'text-muted-foreground'}`}>
                                                        {cmd.description}
                                                    </div>
                                                )}
                                            </div>
                                            <ArrowRight className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-muted-foreground'}`} />
                                        </button>
                                    )
                                })}
                            </div>
                        ))}

                        {filteredCommands.length === 0 && (
                            <div className="text-center py-8 text-muted-foreground">
                                No se encontraron comandos para "{query}"
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between px-4 py-2 border-t border-border bg-secondary/50 text-xs text-muted-foreground">
                        <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1">
                                <kbd className="px-1.5 py-0.5 bg-background rounded">↑↓</kbd>
                                navegar
                            </span>
                            <span className="flex items-center gap-1">
                                <kbd className="px-1.5 py-0.5 bg-background rounded">↵</kbd>
                                seleccionar
                            </span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Command className="w-3 h-3" />
                            <span>K para abrir</span>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

// Trigger button for the palette (optional - can be used in header)
export function CommandPaletteTrigger() {
    return (
        <button
            onClick={() => {
                const event = new KeyboardEvent('keydown', {
                    key: 'k',
                    metaKey: true,
                })
                document.dispatchEvent(event)
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-secondary/50 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
        >
            <Search className="w-4 h-4" />
            <span className="hidden md:inline">Buscar...</span>
            <kbd className="hidden md:inline text-xs bg-background px-1.5 py-0.5 rounded">⌘K</kbd>
        </button>
    )
}
