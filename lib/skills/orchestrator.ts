// Pipeline Orchestrator - Composes skills into complex workflows
// Supports sequential, parallel, and conditional execution
// @ts-nocheck - Dynamic pipeline context types

import { skillRegistry, SkillResult, SkillDefinition } from './registry'

export interface PipelineStep {
    id: string
    skillId: string
    input: Record<string, unknown> | ((ctx: PipelineContext) => Record<string, unknown>)
    outputKey: string // Key to store result in context
    condition?: (ctx: PipelineContext) => boolean // Optional condition to run
    onError?: 'skip' | 'abort' | 'retry' // Error handling
    retries?: number
}

export interface ParallelStep {
    id: string
    parallel: true
    steps: PipelineStep[]
}

export interface ForEachStep {
    id: string
    forEach: string // Key in context containing array to iterate
    skillId: string
    input: (item: unknown, index: number, ctx: PipelineContext) => Record<string, unknown>
    outputKey: string
    maxConcurrency?: number
}

export type PipelineNode = PipelineStep | ParallelStep | ForEachStep

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface PipelineContext {
    [key: string]: any
}

export interface PipelineResult {
    success: boolean
    context: PipelineContext
    logs: PipelineExecutionLog[]
    totalTokens: number
    totalDuration: number
    error?: string
}

export interface PipelineExecutionLog {
    stepId: string
    skillId?: string
    status: 'success' | 'skipped' | 'error'
    tokensUsed: number
    duration: number
    error?: string
}

export interface PipelineDefinition {
    id: string
    name: string
    description: string
    steps: PipelineNode[]
}

class PipelineOrchestrator {
    private pipelines: Map<string, PipelineDefinition> = new Map()

    constructor() {
        this.registerCorePipelines()
    }

    register(pipeline: PipelineDefinition): void {
        this.pipelines.set(pipeline.id, pipeline)
    }

    get(id: string): PipelineDefinition | undefined {
        return this.pipelines.get(id)
    }

    list(): PipelineDefinition[] {
        return Array.from(this.pipelines.values())
    }

    async execute(
        pipelineId: string,
        initialContext: PipelineContext = {}
    ): Promise<PipelineResult> {
        const pipeline = this.pipelines.get(pipelineId)
        if (!pipeline) {
            return {
                success: false,
                context: initialContext,
                logs: [],
                totalTokens: 0,
                totalDuration: 0,
                error: `Pipeline not found: ${pipelineId}`,
            }
        }

        return this.executePipeline(pipeline, initialContext)
    }

    async executePipeline(
        pipeline: PipelineDefinition,
        initialContext: PipelineContext = {}
    ): Promise<PipelineResult> {
        const context: PipelineContext = { ...initialContext }
        const logs: PipelineExecutionLog[] = []
        let totalTokens = 0
        let totalDuration = 0

        const startTime = Date.now()

        for (const step of pipeline.steps) {
            try {
                if ('parallel' in step && step.parallel) {
                    // Parallel execution
                    const results = await this.executeParallel(step as ParallelStep, context)
                    for (const result of results) {
                        logs.push(result.log)
                        totalTokens += result.log.tokensUsed
                        if (result.output) {
                            context[result.outputKey] = result.output
                        }
                    }
                } else if ('forEach' in step) {
                    // ForEach execution
                    const forEachResult = await this.executeForEach(step as ForEachStep, context)
                    logs.push(...forEachResult.logs)
                    totalTokens += forEachResult.totalTokens
                    context[forEachResult.outputKey] = forEachResult.outputs
                } else {
                    // Single step execution
                    const result = await this.executeStep(step as PipelineStep, context)
                    logs.push(result.log)
                    totalTokens += result.log.tokensUsed

                    if (result.log.status === 'error' && (step as PipelineStep).onError === 'abort') {
                        return {
                            success: false,
                            context,
                            logs,
                            totalTokens,
                            totalDuration: Date.now() - startTime,
                            error: result.log.error,
                        }
                    }

                    if (result.output) {
                        context[(step as PipelineStep).outputKey] = result.output
                    }
                }
            } catch (error) {
                console.error(`Pipeline step error:`, error)
                logs.push({
                    stepId: 'id' in step ? step.id : 'unknown',
                    status: 'error',
                    tokensUsed: 0,
                    duration: 0,
                    error: error instanceof Error ? error.message : 'Unknown error',
                })
                return {
                    success: false,
                    context,
                    logs,
                    totalTokens,
                    totalDuration: Date.now() - startTime,
                    error: error instanceof Error ? error.message : 'Unknown error',
                }
            }
        }

        totalDuration = Date.now() - startTime

        return {
            success: true,
            context,
            logs,
            totalTokens,
            totalDuration,
        }
    }

    private async executeStep(
        step: PipelineStep,
        context: PipelineContext
    ): Promise<{ log: PipelineExecutionLog; output: unknown }> {
        const startTime = Date.now()

        // Check condition
        if (step.condition && !step.condition(context)) {
            return {
                log: {
                    stepId: step.id,
                    skillId: step.skillId,
                    status: 'skipped',
                    tokensUsed: 0,
                    duration: 0,
                },
                output: null,
            }
        }

        // Resolve input
        const input = typeof step.input === 'function' ? step.input(context) : step.input

        // Execute with retries
        let attempts = 0
        const maxAttempts = step.retries || 1

        while (attempts < maxAttempts) {
            attempts++
            // Use BYOK: if workspaceId is in context, use the workspace's API key
            const result = context.workspaceId
                ? await skillRegistry.invokeWithWorkspace(step.skillId, input, context.workspaceId)
                : await skillRegistry.invoke(step.skillId, input)


            if (result.success) {
                return {
                    log: {
                        stepId: step.id,
                        skillId: step.skillId,
                        status: 'success',
                        tokensUsed: result.tokensUsed,
                        duration: result.duration,
                    },
                    output: result.output,
                }
            }

            if (attempts >= maxAttempts) {
                return {
                    log: {
                        stepId: step.id,
                        skillId: step.skillId,
                        status: 'error',
                        tokensUsed: result.tokensUsed,
                        duration: Date.now() - startTime,
                        error: result.error,
                    },
                    output: null,
                }
            }

            // Wait before retry
            await new Promise((resolve) => setTimeout(resolve, 1000 * attempts))
        }

        return {
            log: {
                stepId: step.id,
                skillId: step.skillId,
                status: 'error',
                tokensUsed: 0,
                duration: Date.now() - startTime,
                error: 'Max retries exceeded',
            },
            output: null,
        }
    }

    private async executeParallel(
        step: ParallelStep,
        context: PipelineContext
    ): Promise<Array<{ log: PipelineExecutionLog; output: unknown; outputKey: string }>> {
        const promises = step.steps.map(async (s) => {
            const result = await this.executeStep(s, context)
            return { ...result, outputKey: s.outputKey }
        })

        return Promise.all(promises)
    }

    private async executeForEach(
        step: ForEachStep,
        context: PipelineContext
    ): Promise<{
        logs: PipelineExecutionLog[]
        outputs: unknown[]
        outputKey: string
        totalTokens: number
    }> {
        const items = context[step.forEach] as unknown[]
        if (!Array.isArray(items)) {
            return {
                logs: [{
                    stepId: step.id,
                    status: 'error',
                    tokensUsed: 0,
                    duration: 0,
                    error: `${step.forEach} is not an array`,
                }],
                outputs: [],
                outputKey: step.outputKey,
                totalTokens: 0,
            }
        }

        const maxConcurrency = step.maxConcurrency || 3
        const logs: PipelineExecutionLog[] = []
        const outputs: unknown[] = []
        let totalTokens = 0

        // Process in batches for controlled concurrency
        for (let i = 0; i < items.length; i += maxConcurrency) {
            const batch = items.slice(i, i + maxConcurrency)
            const batchPromises = batch.map(async (item, batchIndex) => {
                const index = i + batchIndex
                const input = step.input(item, index, context)
                // Use BYOK: if workspaceId is in context, use the workspace's API key
                return context.workspaceId
                    ? skillRegistry.invokeWithWorkspace(step.skillId, input, context.workspaceId)
                    : skillRegistry.invoke(step.skillId, input)
            })


            const results = await Promise.all(batchPromises)

            results.forEach((result, batchIndex) => {
                const index = i + batchIndex
                logs.push({
                    stepId: `${step.id}[${index}]`,
                    skillId: step.skillId,
                    status: result.success ? 'success' : 'error',
                    tokensUsed: result.tokensUsed,
                    duration: result.duration,
                    error: result.error,
                })
                totalTokens += result.tokensUsed
                outputs.push(result.output)
            })
        }

        return { logs, outputs, outputKey: step.outputKey, totalTokens }
    }

    private registerCorePipelines(): void {
        // Full Month Generation Pipeline
        this.register({
            id: 'generate_month',
            name: 'Generate Full Month',
            description: 'Generates a complete month of content from brand context',
            steps: [
                // Step 1: Generate Brand Snapshot
                {
                    id: 'brand_snapshot',
                    skillId: 'brand_snapshot',
                    input: (ctx) => ({
                        brandName: ctx.brand?.name,
                        industry: ctx.brand?.industry,
                        about: ctx.brand?.about,
                        tone: ctx.brand?.primaryTone,
                        targetAudiences: ctx.brand?.targetAudiences,
                        products: ctx.brand?.products,
                        competitors: ctx.brand?.competitors,
                    }),
                    outputKey: 'brandSnapshot',
                    onError: 'abort',
                },
                // Step 2: Generate Monthly Strategy
                {
                    id: 'monthly_strategy',
                    skillId: 'monthly_strategy',
                    input: (ctx) => ({
                        brandSnapshot: ctx.brandSnapshot,
                        month: ctx.month,
                        year: ctx.year,
                        primaryObjective: ctx.strategyBrief?.primaryObjective,
                        specificGoal: ctx.strategyBrief?.specificGoal,
                        relevantDates: ctx.strategyBrief?.relevantDates,
                        activeCampaigns: ctx.strategyBrief?.activeCampaigns,
                        contentPillars: ctx.strategyBrief?.contentPillars,
                        strategicInputs: ctx.strategyBrief?.strategicInputs,
                        country: ctx.brand?.country,
                        city: ctx.brand?.city,
                        dialect: ctx.brand?.dialect,
                    }),
                    outputKey: 'strategy',
                    onError: 'abort',
                },
                // Step 3: Generate Content Calendar
                {
                    id: 'content_calendar',
                    skillId: 'content_calendar',
                    input: (ctx) => ({
                        strategy: ctx.strategy,
                        plan: ctx.plan,
                        month: ctx.month,
                        year: ctx.year,
                        daysInMonth: new Date(ctx.year as number, ctx.month as number, 0).getDate(),
                    }),
                    outputKey: 'calendar',
                    onError: 'abort',
                },
                // Step 4: Generate hooks for each piece (in parallel batches)
                {
                    id: 'generate_hooks',
                    forEach: 'calendar.pieces',
                    skillId: 'hook_variants',
                    input: (piece: any, _index, ctx) => ({
                        topic: piece.topic,
                        format: piece.format,
                        brandTone: (ctx.brand as any)?.primaryTone || 'profesional',
                        objective: piece.objective,
                        count: 3,
                    }),
                    outputKey: 'hooks',
                    maxConcurrency: 3,
                },
                // Step 5: Generate captions and other copy in parallel
                {
                    id: 'generate_copy',
                    forEach: 'calendar.pieces',
                    skillId: 'social-content',
                    input: (piece: any, index, ctx) => {
                        const hooks = ctx.hooks as any[]
                        // Use generated hook if available, otherwise topic
                        const hookType = 'Curiosity' // Default to Curiosity for now

                        return {
                            topic: piece.topic,
                            platform: piece.format === 'POST' || piece.format === 'CAROUSEL' ? 'Instagram' : 'LinkedIn', // Simple heuristics
                            hookType: hookType,
                            goal: piece.objective || 'Engagement',
                            location: ctx.brand?.country + (ctx.brand?.city ? `, ${ctx.brand.city}` : ''),
                            dialect: ctx.brand?.dialect
                        }
                    },
                    outputKey: 'captions',
                    maxConcurrency: 3,
                },
                // Step 6: Generate hashtags for each piece
                {
                    id: 'generate_hashtags',
                    forEach: 'calendar.pieces',
                    skillId: 'hashtag_set',
                    input: (piece: any, _index, ctx) => ({
                        topic: piece.topic,
                        industry: (ctx.brand as any)?.industry,
                        niche: piece.pillar,
                        requiredHashtags: (ctx.brand as any)?.requiredHashtags,
                        forbiddenHashtags: (ctx.brand as any)?.forbiddenHashtags,
                    }),
                    outputKey: 'hashtagSets',
                    maxConcurrency: 5,
                },
            ],
        })

        // Single Piece Enhancement Pipeline
        this.register({
            id: 'enhance_piece',
            name: 'Enhance Single Piece',
            description: 'Improves an existing piece with fresh hooks, copy, and hashtags',
            steps: [
                {
                    id: 'new_hooks',
                    parallel: true,
                    steps: [
                        {
                            id: 'hook_variants',
                            skillId: 'hook_variants',
                            input: (ctx) => ({
                                topic: ctx.piece?.topic,
                                format: ctx.piece?.format,
                                brandTone: ctx.brand?.primaryTone,
                                objective: ctx.piece?.objective,
                                count: 5,
                            }),
                            outputKey: 'newHooks',
                        },
                        {
                            id: 'cta_variants',
                            skillId: 'cta_variants',
                            input: (ctx) => ({
                                objective: ctx.piece?.objective,
                                brandTone: ctx.brand?.primaryTone,
                                topic: ctx.piece?.topic,
                            }),
                            outputKey: 'newCtas',
                        },
                    ],
                } as ParallelStep,
                {
                    id: 'new_caption',
                    skillId: 'caption_long',
                    input: (ctx) => ({
                        hook: (ctx.newHooks as any)?.hooks?.[0]?.text || ctx.piece?.topic,
                        topic: ctx.piece?.topic,
                        brandTone: ctx.brand?.primaryTone,
                        objective: ctx.piece?.objective,
                    }),
                    outputKey: 'newCaption',
                },
                {
                    id: 'new_hashtags',
                    skillId: 'hashtag_set',
                    input: (ctx) => ({
                        topic: ctx.piece?.topic,
                        industry: ctx.brand?.industry,
                        niche: ctx.piece?.pillar,
                    }),
                    outputKey: 'newHashtags',
                },
            ],
        })

        // QA Pipeline
        this.register({
            id: 'qa_month',
            name: 'QA Month Content',
            description: 'Quality assurance checks on monthly content',
            steps: [
                {
                    id: 'redundancy_check',
                    skillId: 'redundancy_check',
                    input: (ctx) => ({
                        pieces: ctx.pieces,
                    }),
                    outputKey: 'redundancyReport',
                },
                {
                    id: 'voice_checks',
                    forEach: 'pieces',
                    skillId: 'brand_voice_check',
                    input: (piece: any, _index, ctx) => ({
                        content: piece.captionLong || piece.caption,
                        brandTone: (ctx.brand as any)?.primaryTone,
                        brandPersonality: (ctx.brand as any)?.brandPersonality,
                        forbiddenWords: (ctx.brand as any)?.forbiddenWords,
                        guardrails: (ctx.brand as any)?.guardrails,
                    }),
                    outputKey: 'voiceReports',
                    maxConcurrency: 5,
                },
            ],
        })
    }
}

// Singleton instance
export const pipelineOrchestrator = new PipelineOrchestrator()
