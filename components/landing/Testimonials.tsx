"use client"

import { motion } from "framer-motion"
import { Star } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const testimonials = [
    {
        quote: "We went from 40 hours a month on content to just 4. Meridian gave us our strategy time back.",
        author: "Ana Garcia",
        role: "CMO @ TechCorp",
        avatar: "/avatars/ana.jpg"
    },
    {
        quote: "The brand voice accuracy is scary good. It sounds exactly like our senior copywriter.",
        author: "David Chen",
        role: "Head of Growth @ StartupX",
        avatar: "/avatars/david.jpg"
    },
    {
        quote: "Finally, a tool that understands the difference between a LinkedIn post and an Instagram caption.",
        author: "Sarah Jones",
        role: "Social Media Manager",
        avatar: "/avatars/sarah.jpg"
    }
]

export function Testimonials() {
    return (
        <section className="py-32 bg-meridian-cream border-t border-meridian-deep/5">
            <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-20">
                    <h2 className="text-4xl md:text-5xl font-bold text-meridian-deep mb-6">
                        Teams that found their meridian.
                    </h2>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {testimonials.map((t, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            whileHover={{ y: -10 }}
                            className="bg-white p-8 rounded-3xl shadow-sm border border-meridian-deep/5 hover:shadow-xl hover:shadow-meridian-deep/5 transition-all duration-300"
                        >
                            <div className="flex gap-1 mb-6">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} className="w-5 h-5 fill-meridian-gold text-meridian-gold" />
                                ))}
                            </div>

                            <p className="text-xl text-meridian-deep/80 leading-relaxed mb-8 font-medium">
                                &quot;{t.quote}&quot;
                            </p>

                            <div className="flex items-center gap-4">
                                <Avatar className="h-12 w-12 border-2 border-meridian-gold/20">
                                    <AvatarImage src={t.avatar} />
                                    <AvatarFallback className="bg-meridian-deep text-white font-bold">
                                        {t.author[0]}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <div className="font-bold text-meridian-deep">{t.author}</div>
                                    <div className="text-sm text-meridian-deep/50">{t.role}</div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    )
}
