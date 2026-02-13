"use client"

import { motion } from "framer-motion"
import { Clock, UserX, Mail } from "lucide-react"

const problems = [
    {
        icon: Clock,
        title: "Endless Briefing",
        description: "Weeks spent coordinating what to post and when. The strategy document that never ends."
    },
    {
        icon: UserX,
        title: "Manual Creation",
        description: "Designers and copywriters blocked. Creative energy wasted on repetitive execution."
    },
    {
        icon: Mail,
        title: "Eternal Approvals",
        description: "30 email threads for 30 posts. Context switching that kills productivity."
    }
]

export function ProblemSection() {
    return (
        <section className="py-32 bg-meridian-cream relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
                <div className="absolute top-20 left-20 w-64 h-64 bg-meridian-deep rounded-full blur-3xl" />
                <div className="absolute bottom-20 right-20 w-96 h-96 bg-meridian-gold rounded-full blur-3xl" />
            </div>

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="text-center mb-20">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-4xl md:text-5xl font-bold text-meridian-deep mb-6"
                    >
                        30 days. 30 posts. <br />
                        <span className="text-meridian-deep/50">Infinite lost hours.</span>
                    </motion.h2>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {problems.map((item, i) => (
                        <motion.div
                            key={item.title}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.2 }}
                            whileHover={{ y: -10 }}
                            className="bg-meridian-ice/50 backdrop-blur-sm border border-meridian-deep/5 p-8 rounded-2xl shadow-sm hover:shadow-xl hover:shadow-meridian-deep/5 transition-all group"
                        >
                            <div className="w-14 h-14 bg-white rounded-xl shadow-sm flex items-center justify-center mb-6 text-meridian-deep group-hover:bg-meridian-gold group-hover:text-white transition-colors">
                                <item.icon className="w-7 h-7" />
                            </div>
                            <h3 className="text-xl font-bold text-meridian-deep mb-3">{item.title}</h3>
                            <p className="text-meridian-deep/60 leading-relaxed">
                                {item.description}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    )
}
