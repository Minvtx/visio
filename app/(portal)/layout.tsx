'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Sparkles, LogOut, Home, FileText, Download } from 'lucide-react'
import { signOut } from 'next-auth/react'

// Portal layout - SIMPLIFIED for non-technical users
export default function PortalLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname()

    return (
        <div className="min-h-screen bg-gradient-to-br from-[hsl(222,47%,5%)] via-[hsl(222,47%,8%)] to-[hsl(263,30%,10%)]">
            {/* Simple Header */}
            <header className="fixed top-0 left-0 right-0 z-50 glass">
                <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-semibold text-lg">Mi Contenido</span>
                    </div>

                    {/* Simple Navigation */}
                    <nav className="flex items-center gap-2">
                        <NavLink href="/portal" icon={Home} active={pathname === '/portal'}>
                            Inicio
                        </NavLink>
                        <NavLink href="/portal/content" icon={FileText} active={pathname.startsWith('/portal/content')}>
                            Contenido
                        </NavLink>
                        <NavLink href="/portal/downloads" icon={Download} active={pathname === '/portal/downloads'}>
                            Descargas
                        </NavLink>
                        <button
                            onClick={() => signOut({ callbackUrl: '/login' })}
                            className="ml-4 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                            title="Cerrar Sesión"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </nav>
                </div>
            </header>

            {/* Main Content - Centered and Simple */}
            <main className="pt-24 pb-12 px-6">
                <div className="max-w-5xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    )
}

function NavLink({
    href,
    icon: Icon,
    active,
    children
}: {
    href: string
    icon: React.ElementType
    active: boolean
    children: React.ReactNode
}) {
    return (
        <Link
            href={href}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${active
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}
        >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{children}</span>
        </Link>
    )
}
