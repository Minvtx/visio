'use client'

import React, { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, ImageIcon, Copy } from 'lucide-react'

interface Slide {
    order: number
    content: string
    visualPrompt: string // prompt description
}

interface CarouselViewerProps {
    slides: Slide[]
}

export function CarouselViewer({ slides }: CarouselViewerProps) {
    const [currentSlide, setCurrentSlide] = useState(0)

    const nextSlide = () => {
        if (currentSlide < slides.length - 1) setCurrentSlide(currentSlide + 1)
    }

    const prevSlide = () => {
        if (currentSlide > 0) setCurrentSlide(currentSlide - 1)
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Estructura del Carrusel</h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    Slide {currentSlide + 1} de {slides.length}
                </div>
            </div>

            <div className="relative group">
                {/* Navigation Buttons Over Image */}
                <div className="absolute inset-0 flex items-center justify-between p-4 pointer-events-none z-10">
                    <Button
                        variant="secondary"
                        size="icon"
                        className={`pointer-events-auto rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity ${currentSlide === 0 ? 'invisible' : ''}`}
                        onClick={prevSlide}
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                        variant="secondary"
                        size="icon"
                        className={`pointer-events-auto rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity ${currentSlide === slides.length - 1 ? 'invisible' : ''}`}
                        onClick={nextSlide}
                    >
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border rounded-xl overflow-hidden shadow-sm bg-card">
                    {/* Visual Preview Side */}
                    <div className="aspect-square md:aspect-auto md:h-[400px] bg-secondary/30 flex flex-col items-center justify-center p-8 text-center border-b md:border-b-0 md:border-r relative">
                        <ImageIcon className="w-12 h-12 text-muted-foreground/30 mb-4" />
                        <p className="text-sm text-muted-foreground max-w-xs">{slides[currentSlide].visualPrompt}</p>
                        <div className="absolute top-4 left-4 px-2 py-1 bg-background/80 backdrop-blur rounded text-xs font-mono border">
                            Slide #{currentSlide + 1}
                        </div>
                    </div>

                    {/* Copy Side */}
                    <div className="p-8 flex flex-col justify-center min-h-[300px] md:h-[400px]">
                        <div className="space-y-4">
                            <div>
                                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Contenido / Copy</h4>
                                <div className="text-lg font-medium leading-relaxed">
                                    {slides[currentSlide].content}
                                </div>
                            </div>

                            <div className="pt-4 border-t border-border/50">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => navigator.clipboard.writeText(slides[currentSlide].content)}
                                >
                                    <Copy className="w-3 h-3 mr-2" />
                                    Copiar Texto
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Thumbnails */}
            <div className="flex gap-2 overflow-x-auto pb-2 pl-1">
                {slides.map((slide, idx) => (
                    <button
                        key={idx}
                        onClick={() => setCurrentSlide(idx)}
                        className={`flex-shrink-0 w-16 h-16 rounded-md border-2 transition-all flex items-center justify-center text-xs font-medium bg-card
                            ${currentSlide === idx ? 'border-primary ring-2 ring-primary/20' : 'border-border opacity-60 hover:opacity-100'}
                        `}
                    >
                        #{idx + 1}
                    </button>
                ))}
            </div>
        </div>
    )
}
