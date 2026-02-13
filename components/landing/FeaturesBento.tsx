"use client"

import { motion } from "framer-motion"
import { Sparkles, Calendar, Layout, BarChart, Download, Users, Zap } from "lucide-react"

const features = [
    {
        title: "AI Brand Agents",
        description: "Multiple agents working in parallel to create content that matches your brand voice perfectly.",
        icon: Sparkles,
        className: "md:col-span-2",
        color: "bg-meridian-gold/10 text-meridian-gold",
    },
    {
        title: "Total Integration",
        description: "Seamlessly connects with Google Drive, Calendar, and Meet.",
        icon: Zap,
        className: "md:col-span-1",
        color: "bg-meridian-precision/10 text-meridian-precision",
    },
    {
        title: "Client View",
        description: "Share read-only views for seamless approvals and feedback.",
        icon: Users,
        className: "md:col-span-1",
        color: "bg-meridian-deep/10 text-meridian-deep",
    },
    {
        title: "Month-to-Month Generation",
        description: "Visualize and plan your entire year with our infinite calendar interface.",
        icon: Calendar,
        className: "md:col-span-2",
        color: "bg-purple-500/10 text-purple-500",
    },
    {
        title: "Instant Export",
        description: "Download everything in one click. Zip, PDF, or direct scheduling.",
        icon: Download,
        className: "md:col-span-1",
        color: "bg-emerald-500/10 text-emerald-500",
    },
    {
        title: "Real-time Analytics",
        description: "Track performance and adjust strategy on the fly.",
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
                        Your entire social ecosystem. <br />
                        <span className="text-meridian-gold">One single meridian.</span>
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
