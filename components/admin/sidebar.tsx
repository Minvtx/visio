'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
    LayoutDashboard,
    Users,
    Building2,
    FileText,
    Download,
    Settings,
    Sparkles,
    ChevronLeft,
    Shield,
} from 'lucide-react'

const navigation = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Clientes', href: '/admin/clients', icon: Building2 },
    { name: 'Usuarios', href: '/admin/users', icon: Users },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
]

interface SidebarProps {
    collapsed?: boolean
    onToggle?: () => void
}

export function Sidebar({ collapsed = false, onToggle }: SidebarProps) {
    const pathname = usePathname()

    return (
        <aside
            className={cn(
                'fixed left-0 top-0 z-40 h-screen border-r border-border bg-card transition-all duration-300',
                collapsed ? 'w-16' : 'w-64'
            )}
        >
            {/* Logo */}
            <div className="flex h-16 items-center justify-between px-4 border-b border-border">
                <Link href="/admin" className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    {!collapsed && (
                        <span className="font-semibold text-lg">Content Studio</span>
                    )}
                </Link>
                {onToggle && (
                    <button
                        onClick={onToggle}
                        className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
                    >
                        <ChevronLeft
                            className={cn(
                                'w-4 h-4 transition-transform',
                                collapsed && 'rotate-180'
                            )}
                        />
                    </button>
                )}
            </div>

            {/* Navigation */}
            <nav className="p-3 space-y-1">
                {navigation.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                                isActive
                                    ? 'bg-primary/10 text-primary'
                                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                            )}
                        >
                            <item.icon className="w-5 h-5 flex-shrink-0" />
                            {!collapsed && <span>{item.name}</span>}
                        </Link>
                    )
                })}
            </nav>
        </aside>
    )
}
