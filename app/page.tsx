import Link from 'next/link'
import { ArrowRight, Sparkles, Calendar, Users, Download } from 'lucide-react'

export default function HomePage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-[hsl(222,47%,5%)] via-[hsl(222,47%,8%)] to-[hsl(263,30%,10%)]">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 glass">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-semibold text-lg">Content Studio</span>
                    </div>
                    <nav className="flex items-center gap-4">
                        <Link
                            href="/login"
                            className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                            Iniciar Sesión
                        </Link>
                        <Link
                            href="/register"
                            className="px-4 py-2 text-sm rounded-lg gradient-primary text-white font-medium hover:opacity-90 transition-opacity"
                        >
                            Comenzar
                        </Link>
                    </nav>
                </div>
            </header>

            {/* Hero */}
            <main className="pt-32 pb-20 px-6">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm mb-8">
                        <Sparkles className="w-4 h-4" />
                        Potenciado por IA
                    </div>

                    <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white via-white to-primary bg-clip-text text-transparent">
                        Crea contenido mensual en minutos, no días
                    </h1>

                    <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
                        Automatiza tu producción de contenido para redes sociales.
                        Estrategia, calendario y copys generados con IA, listos para aprobar.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href="/register"
                            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl gradient-primary text-white font-semibold text-lg hover:opacity-90 transition-opacity"
                        >
                            Empezar Gratis
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                        <Link
                            href="/login"
                            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-secondary border border-border text-foreground font-semibold text-lg hover:bg-secondary/80 transition-colors"
                        >
                            Iniciar Sesión
                        </Link>
                    </div>
                </div>

                {/* Features */}
                <div className="max-w-6xl mx-auto mt-32 grid md:grid-cols-3 gap-8">
                    <FeatureCard
                        icon={<Calendar className="w-6 h-6" />}
                        title="Calendario Completo"
                        description="Genera un mes entero de contenido con estrategia, pilares y calendario listo para ejecutar."
                    />
                    <FeatureCard
                        icon={<Sparkles className="w-6 h-6" />}
                        title="IA Especializada"
                        description="Skills modulares que entienden tu marca y generan contenido consistente con tu tono de voz."
                    />
                    <FeatureCard
                        icon={<Download className="w-6 h-6" />}
                        title="Exporta y Publica"
                        description="Descarga todo en CSV, PDF o ZIP. Listo para subir a tus herramientas de scheduling."
                    />
                </div>
            </main>
        </div>
    )
}

function FeatureCard({
    icon,
    title,
    description
}: {
    icon: React.ReactNode
    title: string
    description: string
}) {
    return (
        <div className="glass rounded-2xl p-6 hover:border-primary/50 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                {icon}
            </div>
            <h3 className="text-xl font-semibold mb-2">{title}</h3>
            <p className="text-muted-foreground">{description}</p>
        </div>
    )
}
