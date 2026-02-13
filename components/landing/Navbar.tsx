"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion, useScroll, useTransform } from "framer-motion"
import { Sparkles, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"

export function Navbar() {
    const [isScrolled, setIsScrolled] = useState(false)
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const { scrollY } = useScroll()

    // Background opacity based on scroll
    const headerOpacity = useTransform(scrollY, [0, 50], [0, 0.8])
    const headerBlur = useTransform(scrollY, [0, 50], [0, 10])

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20)
        }
        window.addEventListener("scroll", handleScroll)
        return () => window.removeEventListener("scroll", handleScroll)
    }, [])

    return (
        <motion.header
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? "py-3" : "py-5"
                }`}
        >
            <motion.div
                className="absolute inset-0 bg-meridian-deep/80 backdrop-blur-md border-b border-white/5"
                style={{ opacity: headerOpacity }}
            />

            <div className="max-w-7xl mx-auto px-6 relative">
                <div className="flex items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-meridian-gold to-meridian-precision flex items-center justify-center shadow-lg shadow-meridian-gold/20 group-hover:shadow-meridian-gold/40 transition-all">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-display font-bold text-xl text-white">MERIDIAN</span>
                    </Link>

                    {/* Desktop Menu */}
                    <nav className="hidden md:flex items-center gap-8">
                        {["Características", "Cómo Funciona", "Precios", "Recursos"].map((item) => (
                            <Link
                                key={item}
                                href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}
                                className="text-sm text-meridian-cream/70 hover:text-white transition-colors relative group"
                            >
                                {item}
                                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-meridian-gold transition-all duration-300 group-hover:w-full" />
                            </Link>
                        ))}
                    </nav>

                    {/* CTA */}
                    <div className="hidden md:flex items-center gap-4">
                        <Link href="/login" className="text-sm font-medium text-white hover:text-meridian-gold transition-colors">
                            Iniciar Sesión
                        </Link>
                        <Button
                            asChild
                            className="bg-meridian-gold hover:bg-meridian-gold/90 text-meridian-deep font-semibold rounded-full px-6 transition-all hover:scale-105 hover:shadow-lg hover:shadow-meridian-gold/20"
                        >
                            <Link href="/register">
                                Empezar
                            </Link>
                        </Button>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden text-white p-2"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        {isMobileMenuOpen ? <X /> : <Menu />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="absolute top-full left-0 right-0 bg-meridian-deep border-b border-white/10 p-6 md:hidden flex flex-col gap-4"
                >
                    {["Características", "Cómo Funciona", "Precios", "Recursos"].map((item) => (
                        <Link
                            key={item}
                            href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}
                            className="text-lg text-meridian-cream/80 hover:text-white py-2"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            {item}
                        </Link>
                    ))}
                    <div className="h-px bg-white/10 my-2" />
                    <Link href="/login" className="text-lg text-white py-2">Iniciar Sesión</Link>
                    <Link href="/register" className="w-full bg-meridian-gold text-meridian-deep font-bold py-3 text-center rounded-lg">
                        Empezar
                    </Link>
                </motion.div>
            )}
        </motion.header>
    )
}
