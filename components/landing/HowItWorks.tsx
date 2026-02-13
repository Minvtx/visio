"use client"

import { motion } from "framer-motion"
import { ClipboardList, Zap, Check, Calendar } from "lucide-react"

const steps = [
    {
        title: "Define tu Estrategia",
        description: "Ingresa tus guías de marca, tono de voz y objetivos mensuales.",
        icon: ClipboardList,
    },
    {
        title: "Genera en un Click",
        description: "Mira como nuestros agentes de IA localizados crean 30 días de contenido único.",
        icon: Zap,
    },
    {
        title: "Revisa y Refina",
        description: "Aprueba posts o solicita ajustes. La IA aprende de tu feedback.",
        icon: Check,
    },
    {
        title: "Programa o Exporta",
        description: "Publica directamente o descarga tus assets en un solo click.",
        icon: Calendar,
    },
]

export function HowItWorks() {
    return (
        <section className="py-32 bg-meridian-deep relative overflow-hidden" id="how-it-works">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="text-center mb-24">
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                        Del briefing al live <br />
                        <span className="text-meridian-gold">en minutos.</span>
                    </h2>
                </div>

                <div className="relative">
                    {/* Connecting Line */}
                    <div className="hidden md:block absolute top-1/2 left-0 w-full h-1 bg-gradient-to-r from-meridian-gold/0 via-meridian-gold/20 to-meridian-gold/0 -translate-y-1/2" />

                    <div className="grid md:grid-cols-4 gap-12">
                        {steps.map((step, i) => (
                            <motion.div
                                key={step.title}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.2 }}
                                className="relative text-center group"
                            >
                                <div className="w-20 h-20 mx-auto bg-meridian-deep border border-meridian-gold/20 rounded-2xl flex items-center justify-center mb-8 relative z-10 transition-transform duration-300 group-hover:scale-110 group-hover:border-meridian-gold shadow-[0_0_20px_-5px_rgba(245,166,35,0.1)] group-hover:shadow-[0_0_30px_-5px_rgba(245,166,35,0.3)]">
                                    <step.icon className="w-8 h-8 text-meridian-gold" />
                                </div>

                                <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                                <p className="text-meridian-cream/60">
                                    {step.description}
                                </p>

                                {/* Step Number */}
                                <div className="absolute -top-10 left-1/2 -translate-x-1/2 text-9xl font-bold text-white/5 -z-10 font-display select-none">
                                    {i + 1}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}
