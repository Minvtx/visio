// Centralized AI configuration
// All model names and API key logic in one place

export const AI_MODELS = {
    // Primary model for content generation (best quality for Spanish copy)
    PRIMARY: 'claude-3-5-sonnet-20241022',

    // Light model for auxiliary tasks (QA, hashtags, validations)
    // Using same model for now, can switch to Haiku later for cost savings
    LIGHT: 'claude-3-5-sonnet-20241022',
} as const

export type AIModelKey = keyof typeof AI_MODELS
