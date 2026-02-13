"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Check, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

const plans = [
    {
        name: "Starter",
        price: { monthly: 49, yearly: 39 },
        description: "Perfect for solopreneurs and small creators.",
        features: [
            "5 AI Brand Agents",
            "100 AI Generated Posts/mo",
            "1 Workspace",
            "Basic Analytics",
        ]
    },
    {
        name: "Professional",
        price: { monthly: 99, yearly: 79 },
        description: "For growing agencies and marketing teams.",
        popular: true,
        features: [
            "Unlimited AI Brand Agents",
            "Unlimited AI Generated Posts",
            "5 Workspaces",
            "Advanced Analytics",
            "Client Approval Portals",
            "Priority Support",
        ]
    },
    {
        name: "Enterprise",
        price: { monthly: 299, yearly: 249 },
        description: "Custom solutions for large organizations.",
        features: [
            "Everything in Professional",
            "Custom AI Model Training",
            "SSO & Advanced Security",
            "Dedicated Success Manager",
            "SLA Guarantees",
            "API Access",
        ]
    }
]

export function Pricing() {
    const [isYearly, setIsYearly] = useState(true)

    return (
        <section className="py-32 bg-meridian-cream relative" id="pricing">
            <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold text-meridian-deep mb-6">
                        Find your plan.
                    </h2>

                    <div className="flex items-center justify-center gap-4 mt-8">
                        <span className={`text-sm font-medium ${!isYearly ? 'text-meridian-deep' : 'text-meridian-deep/50'}`}>Monthly</span>
                        <button
                            onClick={() => setIsYearly(!isYearly)}
                            className="w-14 h-7 bg-meridian-deep rounded-full relative p-1 transition-colors hover:bg-meridian-deep/90"
                        >
                            <motion.div
                                className="w-5 h-5 bg-white rounded-full shadow-sm"
                                animate={{ x: isYearly ? 28 : 0 }}
                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            />
                        </button>
                        <span className={`text-sm font-medium ${isYearly ? 'text-meridian-deep' : 'text-meridian-deep/50'}`}>
                            Yearly <span className="text-meridian-precision text-xs ml-1 font-bold">-20%</span>
                        </span>
                    </div>
                </div>

                <div className="grid md:grid-cols-3 gap-8 items-center">
                    {plans.map((plan, i) => (
                        <motion.div
                            key={plan.name}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className={`relative bg-white rounded-3xl p-8 border ${plan.popular ? 'border-meridian-gold shadow-xl shadow-meridian-gold/10 scale-105 z-10' : 'border-meridian-deep/5 shadow-sm'} flex flex-col h-full`}
                        >
                            {plan.popular && (
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-meridian-gold text-meridian-deep text-xs font-bold px-4 py-1.5 rounded-full shadow-md flex items-center gap-1">
                                    <Sparkles className="w-3 h-3" />
                                    MOST POPULAR
                                </div>
                            )}

                            <h3 className="text-xl font-bold text-meridian-deep mb-2">{plan.name}</h3>
                            <p className="text-meridian-deep/60 text-sm mb-6 h-10">{plan.description}</p>

                            <div className="mb-8">
                                <span className="text-4xl font-bold text-meridian-deep">${isYearly ? plan.price.yearly : plan.price.monthly}</span>
                                <span className="text-meridian-deep/40">/month</span>
                            </div>

                            <Button
                                className={`w-full mb-8 rounded-full font-bold ${plan.popular ? 'bg-meridian-gold text-meridian-deep hover:bg-meridian-gold/90' : 'bg-meridian-deep text-white hover:bg-meridian-deep/90'}`}
                                asChild
                            >
                                <Link href="/register">
                                    Get Started
                                </Link>
                            </Button>

                            <div className="space-y-4 flex-grow">
                                {plan.features.map((feature) => (
                                    <div key={feature} className="flex items-start gap-3 text-sm text-meridian-deep/80">
                                        <Check className="w-4 h-4 text-meridian-precision mt-0.5 flex-shrink-0" />
                                        <span>{feature}</span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    )
}
