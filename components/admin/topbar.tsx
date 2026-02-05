'use client'

import { Search, Bell, Command } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { NotificationCenter } from './notification-center'
import { UserMenu } from './user-menu'

interface TopBarProps {
    sidebarCollapsed?: boolean
}

export function TopBar({ sidebarCollapsed = false }: TopBarProps) {
    return (
        <header
            className="fixed top-0 right-0 z-30 h-16 border-b border-border bg-card/80 backdrop-blur-md transition-all duration-300"
            style={{ left: sidebarCollapsed ? '4rem' : '16rem' }}
        >
            <div className="flex h-full items-center justify-between px-6">
                {/* Search / Command Palette Trigger */}
                <div className="flex items-center gap-4">
                    <button className="flex items-center gap-3 px-4 py-2 rounded-lg bg-secondary border border-border text-muted-foreground hover:text-foreground transition-colors min-w-[280px]">
                        <Search className="w-4 h-4" />
                        <span className="text-sm">Buscar...</span>
                        <kbd className="ml-auto flex items-center gap-1 text-xs bg-background px-1.5 py-0.5 rounded">
                            <Command className="w-3 h-3" />K
                        </kbd>
                    </button>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-4">
                    {/* Notifications */}
                    <NotificationCenter />

                    {/* User Menu */}
                    <UserMenu />
                </div>
            </div>
        </header>
    )
}
