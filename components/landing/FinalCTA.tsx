"use client"

import { motion, useScroll, useTransform } from "framer-motion"
import { ArrowRight, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useRef } from "react"

export function FinalCTA() {
    const containerRef = useRef(null)
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start end", "end end"]
    })

    const scale = useTransform(scrollYProgress, [0, 1], [0.8, 1])
    const opacity = useTransform(scrollYProgress, [0, 0.5], [0, 1])

    return (
        <section ref={containerRef} className="py-32 relative overflow-hidden bg-meridian-deep flex items-center justify-center min-h-[60vh]">
            <div className="absolute inset-0 bg-meridian-dawn opacity-20" />

            {/* Animated Particles */}
            {[...Array(20)].map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute bg-meridian-gold rounded-full blur-[2px]"
                    style={{
                        width: Math.random() * 4 + 2 + "px",
                        height: Math.random() * 4 + 2 + "px",
                        top: Math.random() * 100 + "%",
                        left: Math.random() * 100 + "%",
                    }}
                    animate={{
                        y: [0, -100, 0],
                        opacity: [0, 1, 0],
                    }}
                    transition={{
                        duration: Math.random() * 5 + 5,
                        repeat: Infinity,
                        ease: "linear",
                    }}
                />
            ))}

            <motion.div
                style={{ scale, opacity }}
                className="relative z-10 text-center max-w-4xl mx-auto px-6"
            >
                <div className="mb-8 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-meridian-gold border border-meridian-gold/20 backdrop-blur-md">
                    <Sparkles className="w-4 h-4" />
                    <span>Empieza tu prueba gratis hoy</span>
                </div>

                <h2 className="text-5xl md:text-7xl font-bold text-white mb-8 tracking-tight leading-tight">
                    Deja de jugar a la agencia.<br />
                    <span className="text-meridian-gold">Empieza a escalar.</span>
                </h2>

                <p className="text-xl text-meridian-cream/60 mb-12 max-w-2xl mx-auto">
                    El sistema está listo. La IA está entrenada.
                    Solo faltas tú para tomar el control.
                </p>

                <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                    <Button
                        size="lg"
                        className="h-20 px-12 text-2xl bg-meridian-gold hover:bg-meridian-gold/90 text-meridian-deep font-bold rounded-full shadow-[0_0_40px_-10px_rgba(245,166,35,0.6)] hover:shadow-[0_0_60px_-10px_rgba(245,166,35,0.8)] transition-all hover:scale-105 group"
                        asChild
                    >
                        <Link href="/register">
                            Empezar Ahora
                            <ArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </Button>
                </div>

                <p className="mt-8 text-sm text-meridian-cream/30">
                    No requiere tarjeta de crédito. Cancela cuando quieras.
                </p>
            </motion.div>
        </section>
    )
}
