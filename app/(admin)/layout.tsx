'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/admin/sidebar'
import { TopBar } from '@/components/admin/topbar'
import { CommandPalette } from '@/components/admin/command-palette'

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

    return (
        <div className="min-h-screen bg-background">
            <Sidebar
                collapsed={sidebarCollapsed}
                onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
            />
            <TopBar sidebarCollapsed={sidebarCollapsed} />
            <main
                className="pt-16 transition-all duration-300"
                style={{ marginLeft: sidebarCollapsed ? '4rem' : '16rem' }}
            >
                <div className="p-6">{children}</div>
            </main>
            <CommandPalette />
        </div>
    )
}

