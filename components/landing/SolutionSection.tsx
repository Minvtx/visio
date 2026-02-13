"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Sparkles, Calendar, Check, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"

export function SolutionSection() {
    const [isGenerating, setIsGenerating] = useState(false)
    const [generatedPosts, setGeneratedPosts] = useState<number[]>([])

    const handleGenerate = () => {
        setIsGenerating(true)
        setGeneratedPosts([])

        // Simulate generation
        let count = 0
        const interval = setInterval(() => {
            count++
            setGeneratedPosts(prev => [...prev, count])
            if (count >= 30) {
                clearInterval(interval)
                setIsGenerating(false)
            }
        }, 50)
    }

    return (
        <section className="py-32 bg-gradient-to-b from-meridian-cream to-meridian-ice relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="grid lg:grid-cols-2 gap-16 items-center">

                    {/* Content */}
                    <div>
                        <motion.h2
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="text-4xl md:text-5xl font-bold text-meridian-deep mb-6"
                        >
                            One click. <br />
                            <span className="text-meridian-precision">A full month.</span>
                        </motion.h2>
                        <p className="text-xl text-meridian-deep/70 mb-8 leading-relaxed">
                            Your brief becomes strategy. Our AI becomes reality.
                            Watch how minutes turn into a month&apos;s worth of high-quality content.
                        </p>

                        <div className="space-y-6 mb-10">
                            {[
                                { icon: Sparkles, text: "Intelligent Briefing Agent" },
                                { icon: Zap, text: "Instant Multi-Format Generation" },
                                { icon: Check, text: "Centralized Approval Workflow" }
                            ].map((item, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.1 }}
                                    className="flex items-center gap-4"
                                >
                                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-meridian-gold">
                                        <item.icon className="w-5 h-5" />
                                    </div>
                                    <span className="font-medium text-meridian-deep">{item.text}</span>
                                </motion.div>
                            ))}
                        </div>

                        <Button
                            size="lg"
                            className="bg-meridian-deep text-white hover:bg-meridian-deep/90 rounded-full px-8 h-12"
                            onClick={handleGenerate}
                            disabled={isGenerating || generatedPosts.length === 30}
                        >
                            <Sparkles className="w-4 h-4 mr-2" />
                            {generatedPosts.length === 30 ? "Month Generated!" : isGenerating ? "Generating..." : "Generate Month"}
                        </Button>
                    </div>

                    {/* Interactive Demo */}
                    <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-tr from-meridian-gold/20 to-meridian-precision/20 rounded-3xl blur-3xl" />

                        <div className="relative bg-white/80 backdrop-blur-md border border-white/50 rounded-3xl p-8 shadow-2xl">
                            {/* Header */}
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h3 className="font-bold text-meridian-deep">October Content</h3>
                                    <p className="text-sm text-meridian-deep/50">Strategy: Autumn Launch</p>
                                </div>
                                <div className="px-4 py-1 bg-meridian-secondary rounded-full text-xs font-medium text-meridian-deep">
                                    {generatedPosts.length} / 30 Posts
                                </div>
                            </div>

                            {/* Calendar Grid */}
                            <div className="grid grid-cols-7 gap-2">
                                {/* Day Headers */}
                                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
                                    <div key={i} className="text-center text-xs font-bold text-meridian-deep/30 mb-2">
                                        {day}
                                    </div>
                                ))}

                                {/* Slots */}
                                {[...Array(30)].map((_, i) => (
                                    <div
                                        key={i}
                                        className="aspect-square rounded-lg bg-meridian-ice/50 border border-meridian-deep/5 relative overflow-hidden group"
                                    >
                                        <div className="absolute top-1 left-1 text-[10px] text-meridian-deep/30 font-mono">
                                            {i + 1}
                                        </div>

                                        <AnimatePresence>
                                            {generatedPosts.includes(i + 1) && (
                                                <motion.div
                                                    initial={{ scale: 0, opacity: 0 }}
                                                    animate={{ scale: 1, opacity: 1 }}
                                                    className="absolute inset-1 bg-gradient-to-br from-meridian-gold to-meridian-precision rounded-md shadow-sm"
                                                >
                                                    {/* Fake Content Lines */}
                                                    <div className="absolute inset-0 p-1.5 flex flex-col gap-1 opacity-50">
                                                        <div className="w-full h-1/2 bg-white/20 rounded-sm" />
                                                        <div className="w-2/3 h-1 bg-white/20 rounded-full" />
                                                        <div className="w-1/2 h-1 bg-white/20 rounded-full" />
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
