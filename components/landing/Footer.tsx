import Link from 'next/link'
import { Sparkles, Twitter, Linkedin, Instagram, Github } from 'lucide-react'

export function Footer() {
    return (
        <footer className="bg-meridian-deep border-t border-white/5 pt-20 pb-10">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
                    {/* Brand */}
                    <div className="space-y-6">
                        <Link href="/" className="flex items-center gap-2 group">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-meridian-gold to-meridian-precision flex items-center justify-center shadow-lg shadow-meridian-gold/20">
                                <Sparkles className="w-5 h-5 text-white" />
                            </div>
                            <span className="font-display font-bold text-xl text-white">MERIDIAN</span>
                        </Link>
                        <p className="text-meridian-cream/60 max-w-xs">
                            The center of your social universe. AI-powered content generation for modern brands.
                        </p>
                        <div className="flex items-center gap-4">
                            {[Twitter, Linkedin, Instagram, Github].map((Icon, i) => (
                                <a
                                    key={i}
                                    href="#"
                                    className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-meridian-cream/60 hover:text-white hover:bg-white/10 transition-all hover:scale-110"
                                >
                                    <Icon className="w-5 h-5" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Columns */}
                    {[
                        { title: "Product", links: ["Features", "Pricing", "Roadmap", "Changelog"] },
                        { title: "Resources", links: ["Community", "Help Center", "API Docs", "Status"] },
                        { title: "Company", links: ["About", "Blog", "Careers", "Contact"] },
                    ].map((col) => (
                        <div key={col.title}>
                            <h4 className="font-semibold text-white mb-6">{col.title}</h4>
                            <ul className="space-y-4">
                                {col.links.map((link) => (
                                    <li key={link}>
                                        <Link
                                            href="#"
                                            className="text-meridian-cream/60 hover:text-meridian-gold transition-colors block hover:translate-x-1 duration-300"
                                        >
                                            {link}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-meridian-cream/40">
                    <p>© 2025 Meridian Social Suite. All rights reserved.</p>
                    <div className="flex items-center gap-8">
                        <Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link>
                        <Link href="#" className="hover:text-white transition-colors">Terms of Service</Link>
                    </div>
                </div>

                <div className="text-center mt-12">
                    <p className="text-meridian-cream/20 font-mono text-xs tracking-[0.2em] uppercase">Find your meridian</p>
                </div>
            </div>
        </footer>
    )
}
