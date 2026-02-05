
import { SkillDefinition as Skill } from './registry'

export const brandGuidelinesSkill: Skill = {
    id: 'brand-guidelines',
    name: 'Brand Guidelines Enforcer',
    description: 'Advanced LLM-based audit of content against a full Brand Kit (Voice, Tone, Values).',
    category: 'qa',
    inputSchema: {
        type: 'object',
        properties: {
            content: { type: 'string', description: 'Content to audit' },
            brandKit: {
                type: 'object',
                description: 'Full Brand Kit object (Tone, Personality, Values, Forbidden terms)',
                required: ['tone', 'brandPersonality']
            }
        },
        required: ['content', 'brandKit']
    },
    outputSchema: {
        type: 'object',
        properties: {
            compliant: { type: 'boolean' },
            score: { type: 'number', description: '0-100 score' },
            violations: { type: 'array', items: { type: 'string' } },
            suggestions: { type: 'array', items: { type: 'string' } }
        }
    },
    systemPrompt: `You are a Brand Guardian.
Your job is to ensure content strictly adheres to the provided BRAND KIT.

### BRAND KIT ANALYSIS
You will receive a Brand Kit containing:
- Voice & Tone (e.g., "Professional but friendly")
- Personality (e.g., "Innovator", "Sage")
- Forbidden/Required words
- Values

### JOB
Audit the CONTENT against the BRAND KIT.
1. Check Voice/Tone match.
2. Check for forbidden concepts/words (semantic check, not just regex).
3. Check alignment with Brand Values.

Output JSON:
- compliant: true if it passes minimal standards (score > 70).
- score: 0-100 rating of brand alignment.
- violations: List of specific issues found.
- suggestions: Specific rewrites or fixes.
`,
    temperature: 0.2,
    maxTokens: 800
}
