"use client"

import { motion, useScroll, useTransform } from "framer-motion"
import { ArrowRight, Play, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function HeroSection() {
    const { scrollY } = useScroll()
    const y1 = useTransform(scrollY, [0, 500], [0, 200])
    const y2 = useTransform(scrollY, [0, 500], [0, -150])
    const opacity = useTransform(scrollY, [0, 300], [1, 0])

    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-32 pb-20">
            {/* Animated Background */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-meridian-deep" />
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-meridian-precision/20 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-meridian-gold/10 rounded-full blur-3xl animate-pulse delay-1000" />

                {/* Meridian Lines Shader Simulation */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
            </div>

            <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
                {/* Badge */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8 hover:bg-white/10 transition-colors cursor-default"
                >
                    <Sparkles className="w-4 h-4 text-meridian-gold" />
                    <span className="text-sm font-medium text-meridian-cream/80">Gestión Social AI-First</span>
                </motion.div>

                {/* Headline */}
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="text-6xl md:text-8xl font-display font-bold mb-6 tracking-tight"
                >
                    <span className="block text-white mb-2">El centro de tu</span>
                    <span className="bg-gradient-to-r from-meridian-gold via-meridian-precision to-meridian-gold bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                        universo social
                    </span>
                </motion.h1>

                {/* Subheadline */}
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="text-xl md:text-2xl text-meridian-cream/60 mb-10 max-w-3xl mx-auto leading-relaxed"
                >
                    Un click. Un mes completo de contenido.
                    <br className="hidden md:block" />
                    Generado con precisión por agentes de IA que realmente entienden tu marca.
                </motion.p>

                {/* CTAs */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.6 }}
                    className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-20"
                >
                    <Link href="/register">
                        <Button
                            size="lg"
                            className="h-14 px-8 text-lg bg-meridian-gold hover:bg-meridian-gold/90 text-meridian-deep font-bold rounded-full shadow-[0_0_20px_-5px_rgba(245,166,35,0.4)] hover:shadow-[0_0_30px_-5px_rgba(245,166,35,0.6)] transition-all hover:scale-105"
                        >
                            Empezar Prueba Gratis
                            <ArrowRight className="ml-2 w-5 h-5" />
                        </Button>
                    </Link>

                    <Button
                        variant="outline"
                        size="lg"
                        className="h-14 px-8 text-lg border-white/10 text-white hover:bg-white/5 rounded-full backdrop-blur-md transition-all hover:scale-105 group"
                    >
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center mr-3 group-hover:bg-meridian-precision group-hover:text-white transition-colors">
                            <Play className="w-4 h-4 fill-current pl-0.5" />
                        </div>
                        Ver Demo
                    </Button>
                </motion.div>

                {/* Mockup / Visual */}
                <motion.div
                    initial={{ opacity: 0, y: 100, rotateX: 20 }}
                    animate={{ opacity: 1, y: 0, rotateX: 0 }}
                    transition={{ duration: 1, delay: 0.8, type: "spring" }}
                    className="relative max-w-5xl mx-auto"
                >
                    {/* Glow effect behind mockup */}
                    <div className="absolute -inset-10 bg-gradient-to-r from-meridian-gold/20 to-meridian-precision/20 rounded-[3rem] blur-2xl opacity-50" />

                    <div className="relative glass border border-white/10 p-2 rounded-2xl shadow-2xl backdrop-blur-xl bg-meridian-deep/40 overflow-hidden">
                        <div className="aspect-[16/10] bg-meridian-deep/80 rounded-xl overflow-hidden relative">
                            {/* Placeholder for Product UI */}
                            <div className="absolute inset-0 flex items-center justify-center text-meridian-cream/20 font-mono text-sm border border-white/5 m-4 rounded-lg bg-white/5">
                                [Product Interface Mockup Placeholder]
                            </div>

                            {/* Orbital Particles (Simulated) */}
                            {[...Array(5)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    className="absolute w-2 h-2 bg-meridian-gold rounded-full blur-[1px]"
                                    animate={{
                                        x: [0, 100, 0],
                                        y: [0, -50, 0],
                                        opacity: [0, 1, 0],
                                    }}
                                    transition={{
                                        duration: 3 + i,
                                        repeat: Infinity,
                                        ease: "easeInOut",
                                        delay: i * 0.5,
                                    }}
                                    style={{
                                        top: `${20 + i * 15}%`,
                                        left: `${10 + i * 20}%`,
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Scroll Indicator */}
            <motion.div
                style={{ opacity }}
                className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
            >
                <div className="w-px h-16 bg-gradient-to-b from-meridian-gold to-transparent" />
                <span className="text-meridian-cream/40 text-[10px] tracking-widest uppercase">Scroll</span>
            </motion.div>
        </section>
    )
}
