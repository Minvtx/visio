"use client"

import { motion } from "framer-motion"
import Image from "next/image"

const logos = [
    { name: "Acme Corp", src: "/logos/acme.svg" },
    { name: "Global Tech", src: "/logos/global.svg" },
    { name: "Nebula", src: "/logos/nebula.svg" },
    { name: "Vertex", src: "/logos/vertex.svg" },
    { name: "Horizon", src: "/logos/horizon.svg" },
    { name: "Pinnacle", src: "/logos/pinnacle.svg" },
]

// Duplicate logos for infinite scroll
const displayLogos = [...logos, ...logos, ...logos]

export function SocialProof() {
    return (
        <section className="py-10 border-y border-white/5 bg-meridian-deep/50 backdrop-blur-sm relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-6 mb-8 text-center">
                <p className="text-sm font-medium text-meridian-cream/40 uppercase tracking-widest">
                    Trusted by modern marketing teams at
                </p>
            </div>

            <div className="relative flex overflow-x-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-meridian-deep to-transparent z-10" />
                <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-meridian-deep to-transparent z-10" />

                <motion.div
                    initial={{ x: 0 }}
                    animate={{ x: "-33.33%" }}
                    transition={{
                        duration: 30,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                    className="flex items-center gap-16 px-8 whitespace-nowrap"
                >
                    {displayLogos.map((logo, i) => (
                        <div
                            key={`${logo.name}-${i}`}
                            className="flex items-center justify-center opacity-30 hover:opacity-100 transition-opacity duration-300 grayscale hover:grayscale-0 cursor-default"
                        >
                            {/* Placeholder for real logos - using text for now if no images */}
                            <span className="text-xl font-bold font-display">{logo.name}</span>
                        </div>
                    ))}
                </motion.div>
            </div>
        </section>
    )
}
