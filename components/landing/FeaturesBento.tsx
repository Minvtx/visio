"use client"

import { motion } from "framer-motion"
import { Sparkles, Calendar, Layout, BarChart, Download, Users, Zap } from "lucide-react"

const features = [
    {
        title: "Agentes de Marca IA",
        description: "Múltiples agentes trabajando en paralelo para crear contenido que coincide perfectamente con la voz de tu marca.",
        icon: Sparkles,
        className: "md:col-span-2",
        color: "bg-meridian-gold/10 text-meridian-gold",
    },
    {
        title: "Integración Total",
        description: "Conecta Google Drive, Calendar y Meet sin fricción.",
        icon: Zap,
        className: "md:col-span-1",
        color: "bg-meridian-precision/10 text-meridian-precision",
    },
    {
        title: "Vista de Cliente",
        description: "Comparte vistas de solo lectura para aprobaciones y feedback sin complicaciones.",
        icon: Users,
        className: "md:col-span-1",
        color: "bg-meridian-deep/10 text-meridian-deep",
    },
    {
        title: "Generación Mes a Mes",
        description: "Visualiza y planifica tu año entero con nuestra interfaz de gestión mensual.",
        icon: Calendar,
        className: "md:col-span-2",
        color: "bg-purple-500/10 text-purple-500",
    },
    {
        title: "Exportación Instantánea",
        description: "Descarga todo en un click. Zip, PDF, o programación directa.",
        icon: Download,
        className: "md:col-span-1",
        color: "bg-emerald-500/10 text-emerald-500",
    },
    {
        title: "Analíticas en Tiempo Real",
        description: "Rastrea el rendimiento y ajusta la estrategia al vuelo.",
        icon: BarChart,
        className: "md:col-span-1",
        color: "bg-rose-500/10 text-rose-500",
    },
]

export function FeaturesBento() {
    return (
        <section className="py-32 bg-meridian-cream relative" id="features">
            <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-20">
                    <h2 className="text-4xl md:text-5xl font-bold text-meridian-deep mb-6">
                        Todo tu ecosistema social. <br />
                        <span className="text-meridian-gold">Un solo meridiano.</span>
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {features.map((feature, i) => (
                        <motion.div
                            key={feature.title}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            whileHover={{ y: -5 }}
                            className={`${feature.className} group relative bg-white border border-meridian-deep/5 rounded-3xl p-8 overflow-hidden hover:shadow-2xl hover:shadow-meridian-deep/5 transition-all duration-300`}
                        >
                            <div className={`absolute top-0 right-0 p-32 opacity-10 rounded-full blur-3xl transition-transform duration-700 group-hover:scale-150 ${feature.color.split(' ')[0].replace('/10', '/30')}`} />

                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 ${feature.color}`}>
                                <feature.icon className="w-6 h-6" />
                            </div>

                            <h3 className="text-2xl font-bold text-meridian-deep mb-3">{feature.title}</h3>
                            <p className="text-meridian-deep/60 leading-relaxed">
                                {feature.description}
                            </p>

                            {/* Decorative Elements on hover */}
                            <div className="absolute bottom-0 right-0 w-full h-1 bg-gradient-to-r from-transparent via-meridian-gold/50 to-transparent transform scale-x-0 group-hover:scale-x-100 transition-transform duration-700" />
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    )
}
