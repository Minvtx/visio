"use client"

import { Navbar } from "@/components/landing/Navbar"
import { Footer } from "@/components/landing/Footer"
import { HeroSection } from "@/components/landing/HeroSection"
import { SocialProof } from "@/components/landing/SocialProof"
import { ProblemSection } from "@/components/landing/ProblemSection"
import { SolutionSection } from "@/components/landing/SolutionSection"
import { FeaturesBento } from "@/components/landing/FeaturesBento"
import { HowItWorks } from "@/components/landing/HowItWorks"
import { Testimonials } from "@/components/landing/Testimonials"
import { Pricing } from "@/components/landing/Pricing"
import { FinalCTA } from "@/components/landing/FinalCTA"

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-meridian-deep text-white selection:bg-meridian-gold/30 selection:text-meridian-gold font-sans">
            <Navbar />

            <main>
                <HeroSection />
                <SocialProof />
                <ProblemSection />
                <SolutionSection />
                <FeaturesBento />
                <HowItWorks />
                <Testimonials />
                <Pricing />
                <FinalCTA />
            </main>

            <Footer />
        </div>
    )
}
