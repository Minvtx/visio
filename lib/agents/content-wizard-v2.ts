// Content Wizard Agent v2 - Uses Modular Skills Pipeline
// This version orchestrates multiple skills for better control and customization

import Anthropic from '@anthropic-ai/sdk'
import { pipelineOrchestrator, PipelineContext } from '@/lib/skills/orchestrator'
import { skillRegistry } from '@/lib/skills/registry'

// Re-export types from legacy module for backwards compatibility
export type { BrandContext, ContentPlan, MonthlyStrategyBrief, GeneratedPiece, ContentWizardOutput } from './content-wizard-legacy'

import {
    BrandContext,
    ContentPlan,
    MonthlyStrategyBrief,
    GeneratedPiece,
    ContentWizardOutput,
} from './content-wizard-legacy'

// Import legacy wizard for fallback
import { contentWizard as legacyWizard } from './content-wizard-legacy'

export interface GenerationMode {
    mode: 'pipeline' | 'monolithic'
    reason?: string
}

export interface PipelineGenerationResult extends ContentWizardOutput {
    mode: 'pipeline'
    pipelineLogs: any[]
    totalDuration: number
}

export interface MonolithicGenerationResult extends ContentWizardOutput {
    mode: 'monolithic'
}

export type GenerationResult = PipelineGenerationResult | MonolithicGenerationResult

class ContentWizardV2 {
    private anthropic: Anthropic

    constructor() {
        this.anthropic = new Anthropic({
            apiKey: process.env.ANTHROPIC_API_KEY,
        })
    }

    /**
     * Generates a full month of content using the modular pipeline approach
     * Falls back to monolithic generation if pipeline fails
     */
    async generateMonth(
        brand: BrandContext,
        month: number,
        year: number,
        plan: ContentPlan,
        strategyBrief?: MonthlyStrategyBrief,
        options?: {
            usePipeline?: boolean;
            fallbackToMonolithic?: boolean;
            workspaceId?: string;  // For BYOK - uses workspace's API key
        }
    ): Promise<ContentWizardOutput> {
        const usePipeline = options?.usePipeline ?? true
        const fallbackToMonolithic = options?.fallbackToMonolithic ?? true
        const workspaceId = options?.workspaceId

        if (usePipeline) {
            try {
                return await this.generateWithPipeline(brand, month, year, plan, strategyBrief, workspaceId)
            } catch (error) {
                console.error('Pipeline generation failed:', error)
                if (fallbackToMonolithic) {
                    console.log('Falling back to monolithic generation...')
                    return await legacyWizard.generateMonth(brand, month, year, plan, strategyBrief)
                }
                throw error
            }
        }

        return await legacyWizard.generateMonth(brand, month, year, plan, strategyBrief)
    }


    /**
     * Generates content using the modular pipeline system
     * This gives more control and allows for partial regeneration
     */
    private async generateWithPipeline(
        brand: BrandContext,
        month: number,
        year: number,
        plan: ContentPlan,
        strategyBrief?: MonthlyStrategyBrief,
        workspaceId?: string
    ): Promise<ContentWizardOutput> {
        // Prepare initial context for the pipeline
        const context: PipelineContext = {
            brand,
            month,
            year,
            plan,
            strategyBrief,
            workspaceId, // BYOK: pass workspaceId so orchestrator uses correct API key
        }

        // Execute the generate_month pipeline
        const result = await pipelineOrchestrator.execute('generate_month', context)

        if (!result.success) {
            throw new Error(`Pipeline failed: ${result.error}`)
        }


        // Extract and transform results
        const calendar = result.context.calendar as any
        const hooks = result.context.hooks as any[]
        const captions = result.context.captions as any[]
        const hashtagSets = result.context.hashtagSets as any[]
        const strategy = result.context.strategy as any

        // Combine all generated data into ContentWizardOutput format
        const pieces: GeneratedPiece[] = calendar.pieces.map((piece: any, index: number) => {
            const pieceHooks = hooks[index]?.hooks || [{ text: piece.topic, style: 'statement' }]
            const pieceCaption = captions[index]?.caption || ''
            const pieceHashtags = hashtagSets[index]?.hashtags?.map((h: any) => h.tag) || []

            return {
                dayOfMonth: piece.dayOfMonth,
                format: piece.format,
                pillar: piece.pillar,
                topic: piece.topic,
                objective: piece.objective,
                strategicJustification: piece.strategicJustification || `Content for ${piece.pillar}`,
                targetAudience: piece.targetAudience || 'General audience',
                hooks: pieceHooks,
                captionLong: pieceCaption,
                captionShort: pieceCaption.substring(0, 150) + '...',
                ctas: ['Guarda este post', 'Comenta tu opinión', 'Comparte con alguien'],
                hashtags: pieceHashtags,
                suggestedTime: piece.suggestedTime || '12:00',
                visualConcept: `Visual concept for ${piece.topic}`,
                carouselSlides: piece.format === 'CAROUSEL' ? this.generatePlaceholderSlides(piece.topic) : undefined,
            }
        })

        return {
            strategy: {
                monthlyObjective: strategy?.monthlyObjective || strategyBrief?.primaryObjective || 'Increase brand awareness',
                pillars: strategy?.pillars || [
                    { name: 'Educativo', description: 'Contenido de valor', percentage: 40 },
                    { name: 'Engagement', description: 'Interacción con la comunidad', percentage: 30 },
                    { name: 'Promocional', description: 'Productos y servicios', percentage: 20 },
                    { name: 'Entretenimiento', description: 'Contenido ligero', percentage: 10 },
                ],
                keyDates: strategy?.keyDates || [],
                audienceInsights: strategy?.audienceInsights || [],
            },
            pieces,
            metrics: {
                totalPieces: pieces.length,
                formatDistribution: {
                    POST: pieces.filter(p => p.format === 'POST').length,
                    CAROUSEL: pieces.filter(p => p.format === 'CAROUSEL').length,
                    REEL: pieces.filter(p => p.format === 'REEL').length,
                    STORY: pieces.filter(p => p.format === 'STORY').length,
                },
                tokensUsed: result.totalTokens,
            },
        }
    }

    private generatePlaceholderSlides(topic: string): Array<{ slideNumber: number; content: string; purpose: string }> {
        return [
            { slideNumber: 1, content: `Hook: ${topic}`, purpose: 'hook' },
            { slideNumber: 2, content: 'Key point 1', purpose: 'value' },
            { slideNumber: 3, content: 'Key point 2', purpose: 'value' },
            { slideNumber: 4, content: 'Key point 3', purpose: 'value' },
            { slideNumber: 5, content: 'Call to action', purpose: 'cta' },
        ]
    }

    /**
     * Regenerate a single piece using individual skills
     * More granular control than full month regeneration
     */
    async regeneratePiece(
        brand: BrandContext,
        existingPiece: GeneratedPiece,
        options?: {
            regenerateHook?: boolean
            regenerateCopy?: boolean
            regenerateHashtags?: boolean
            regenerateVisual?: boolean
            feedback?: string
        }
    ): Promise<GeneratedPiece> {
        const updatedPiece = { ...existingPiece }

        // Regenerate hooks if requested
        if (options?.regenerateHook !== false) {
            const hookResult = await skillRegistry.invoke<{ hooks: Array<{ text: string; style: string }> }>(
                'hook_variants',
                {
                    topic: existingPiece.topic,
                    format: existingPiece.format,
                    brandTone: brand.primaryTone,
                    objective: existingPiece.objective,
                    count: 5,
                }
            )
            if (hookResult.success && hookResult.output) {
                updatedPiece.hooks = hookResult.output.hooks
            }
        }

        // Regenerate caption if requested
        if (options?.regenerateCopy !== false) {
            const captionResult = await skillRegistry.invoke<{ caption: string }>(
                'caption_long',
                {
                    hook: updatedPiece.hooks[0]?.text || existingPiece.topic,
                    topic: existingPiece.topic,
                    brandTone: brand.primaryTone,
                    objective: existingPiece.objective,
                    keyPoints: options?.feedback ? [options.feedback] : undefined,
                }
            )
            if (captionResult.success && captionResult.output) {
                updatedPiece.captionLong = captionResult.output.caption
                updatedPiece.captionShort = captionResult.output.caption.substring(0, 150) + '...'
            }
        }

        // Regenerate hashtags if requested
        if (options?.regenerateHashtags !== false) {
            const hashtagResult = await skillRegistry.invoke<{ hashtags: Array<{ tag: string }> }>(
                'hashtag_set',
                {
                    topic: existingPiece.topic,
                    industry: brand.industry,
                    niche: existingPiece.pillar,
                    requiredHashtags: brand.requiredHashtags,
                    forbiddenHashtags: brand.forbiddenHashtags,
                }
            )
            if (hashtagResult.success && hashtagResult.output) {
                updatedPiece.hashtags = hashtagResult.output.hashtags.map(h => h.tag)
            }
        }

        // Regenerate visual concept if requested
        if (options?.regenerateVisual !== false) {
            const visualResult = await skillRegistry.invoke<{ visualConcept: string }>(
                'visual_prompt',
                {
                    topic: existingPiece.topic,
                    format: existingPiece.format,
                    brandStyle: brand.primaryTone,
                    hook: updatedPiece.hooks[0]?.text,
                    caption: updatedPiece.captionLong,
                }
            )
            if (visualResult.success && visualResult.output) {
                updatedPiece.visualConcept = visualResult.output.visualConcept
            }
        }

        // Regenerate carousel slides if it's a carousel
        if (existingPiece.format === 'CAROUSEL' && options?.regenerateCopy !== false) {
            const slidesResult = await skillRegistry.invoke<{ slides: Array<{ slideNumber: number; content: string; purpose: string }> }>(
                'carousel_slides',
                {
                    topic: existingPiece.topic,
                    hook: updatedPiece.hooks[0]?.text || existingPiece.topic,
                    numberOfSlides: 5,
                    brandTone: brand.primaryTone,
                }
            )
            if (slidesResult.success && slidesResult.output) {
                updatedPiece.carouselSlides = slidesResult.output.slides
            }
        }

        return updatedPiece
    }

    /**
     * Regenerate only specific elements of a piece
     */
    async regenerateElement(
        brand: BrandContext,
        piece: GeneratedPiece,
        element: 'hook' | 'copy' | 'hashtags' | 'visual' | 'cta' | 'humanize' | 'optimize'
    ): Promise<Partial<GeneratedPiece>> {
        switch (element) {
            case 'hook': {
                const result = await skillRegistry.invoke<{ hooks: Array<{ text: string; style: string }> }>(
                    'hook_variants',
                    {
                        topic: piece.topic,
                        format: piece.format,
                        brandTone: brand.primaryTone,
                        objective: piece.objective,
                        count: 5,
                    }
                )
                return result.success ? { hooks: result.output!.hooks } : {}
            }

            case 'copy': {
                const result = await skillRegistry.invoke<{ caption: string }>(
                    'caption_long',
                    {
                        hook: piece.hooks[0]?.text || piece.topic,
                        topic: piece.topic,
                        brandTone: brand.primaryTone,
                        objective: piece.objective,
                    }
                )
                if (result.success) {
                    return {
                        captionLong: result.output!.caption,
                        captionShort: result.output!.caption.substring(0, 150) + '...',
                    }
                }
                return {}
            }

            case 'hashtags': {
                const result = await skillRegistry.invoke<{ hashtags: Array<{ tag: string }> }>(
                    'hashtag_set',
                    {
                        topic: piece.topic,
                        industry: brand.industry,
                        niche: piece.pillar,
                    }
                )
                return result.success ? { hashtags: result.output!.hashtags.map(h => h.tag) } : {}
            }

            case 'visual': {
                const result = await skillRegistry.invoke<{ visualConcept: string }>(
                    'visual_prompt',
                    {
                        topic: piece.topic,
                        format: piece.format,
                        brandStyle: brand.primaryTone,
                    }
                )
                return result.success ? { visualConcept: result.output!.visualConcept } : {}
            }

            case 'cta': {
                const result = await skillRegistry.invoke<{ ctas: Array<{ text: string }> }>(
                    'cta_variants',
                    {
                        objective: piece.objective,
                        brandTone: brand.primaryTone,
                        topic: piece.topic,
                    }
                )
                return result.success ? { ctas: result.output!.ctas.map(c => c.text) } : {}
            }

            case 'humanize': {
                const result = await skillRegistry.invoke<{ humanizedContent: string }>(
                    'humanizer',
                    {
                        content: piece.captionLong,
                        audience: brand.industry,
                        personality: brand.primaryTone
                    }
                )
                return result.success ? {
                    captionLong: result.output!.humanizedContent,
                    captionShort: result.output!.humanizedContent.substring(0, 150) + '...'
                } : {}
            }

            case 'optimize': {
                const result = await skillRegistry.invoke<{ editedContent: string }>(
                    'copy-editing',
                    {
                        content: piece.captionLong,
                        strictness: 'medium',
                        focus: 'punchier and more professional'
                    }
                )
                return result.success ? {
                    captionLong: result.output!.editedContent,
                    captionShort: result.output!.editedContent.substring(0, 150) + '...'
                } : {}
            }

            default:
                return {}
        }
    }
}

// Export singleton instance
export const contentWizardV2 = new ContentWizardV2()

// Default export for backwards compatibility
export const contentWizard = contentWizardV2
