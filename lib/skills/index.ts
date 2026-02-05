// Skills System - Central Export
// Provides a unified interface to the modular skills system

export { skillRegistry, type SkillDefinition, type SkillResult } from './registry'
export { pipelineOrchestrator, type PipelineDefinition, type PipelineResult, type PipelineContext } from './orchestrator'

// Re-export specific skill categories for convenience
import { skillRegistry } from './registry'

export const skills = {
    // Strategy skills
    brand_snapshot: () => skillRegistry.get('brand_snapshot'),
    monthly_strategy: () => skillRegistry.get('monthly_strategy'),
    content_calendar: () => skillRegistry.get('content_calendar'),

    // Copy skills
    hook_variants: () => skillRegistry.get('hook_variants'),
    caption_long: () => skillRegistry.get('caption_long'),
    caption_short: () => skillRegistry.get('caption_short'),
    cta_variants: () => skillRegistry.get('cta_variants'),
    hashtag_set: () => skillRegistry.get('hashtag_set'),

    // Visual skills
    visual_prompt: () => skillRegistry.get('visual_prompt'),
    carousel_slides: () => skillRegistry.get('carousel_slides'),

    // QA skills
    redundancy_check: () => skillRegistry.get('redundancy_check'),
    brand_voice_check: () => skillRegistry.get('brand_voice_check'),

    // Skills.sh Imported (Phase 1 & 2)
    copywriting: () => skillRegistry.get('copywriting'),
    social_content: () => skillRegistry.get('social-content'),
    marketing_psychology: () => skillRegistry.get('marketing-psychology'),
    brand_guidelines: () => skillRegistry.get('brand-guidelines'),
    copy_editing: () => skillRegistry.get('copy-editing'),
    humanizer: () => skillRegistry.get('humanizer'),
    marketing_ideas: () => skillRegistry.get('marketing-ideas'),
}

// Helper functions
export async function invokeSkill<T>(skillId: string, input: Record<string, unknown>) {
    return skillRegistry.invoke<T>(skillId, input)
}

export async function runPipeline(pipelineId: string, context: Record<string, unknown>) {
    const { pipelineOrchestrator } = await import('./orchestrator')
    return pipelineOrchestrator.execute(pipelineId, context)
}

// List all available skills
export function listSkills(category?: 'strategy' | 'copy' | 'visual' | 'qa') {
    return skillRegistry.list(category)
}

// List all available pipelines
export async function listPipelines() {
    const { pipelineOrchestrator } = await import('./orchestrator')
    return pipelineOrchestrator.list()
}
