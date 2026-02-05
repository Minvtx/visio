// Agents module exports
// Simplified generation system

// Main content generator (monolithic - efficient)
export { contentGenerator } from './content-generator'
export type {
    BrandContext,
    MonthBrief,
    ContentPlan,
    GeneratedPiece,
    MonthStrategy,
    GenerationResult
} from './content-generator'

// Improvement skills (on-demand refinement)
export {
    humanize,
    brandCheck,
    regeneratePiece,
    improveCopy
} from './improvement-skills'

export type {
    HumanizeInput,
    HumanizeOutput,
    BrandCheckInput,
    BrandCheckOutput,
    RegeneratePieceInput,
    RegeneratedPiece,
    ImproveCopyInput,
    ImproveCopyOutput
} from './improvement-skills'

// Legacy exports for backwards compatibility (deprecated)
// TODO: Remove once all usages are migrated
export { contentWizard, contentWizardV2 } from './content-wizard-v2'
