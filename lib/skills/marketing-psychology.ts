
import { SkillDefinition as Skill } from './registry'

export const marketingPsychologySkill: Skill = {
    id: 'marketing-psychology',
    name: 'Marketing Psychology Auditor',
    description: 'Analyzes or enhances content using proven psychological triggers (Cialdini, Behavioral Economics).',
    category: 'qa',
    inputSchema: {
        type: 'object',
        properties: {
            content: { type: 'string', description: 'Content to analyze or enhance' },
            goal: { type: 'string', description: 'Goal (Conversion, Trust, Urgency)' },
            triggers: {
                type: 'array',
                items: { type: 'string' },
                description: 'Specific triggers to apply (Reciprocity, Social Proof, Scarcity, etc.)'
            }
        },
        required: ['content']
    },
    outputSchema: {
        type: 'object',
        properties: {
            enhancedContent: { type: 'string' },
            appliedTriggers: { type: 'array', items: { type: 'string' } },
            explanation: { type: 'string' }
        }
    },
    systemPrompt: `You are a Behavioral Psychology expert applied to Marketing.

### CORE MENTAL MODELS
1. **Reciprocity**: Give value first (freebies, tips) to create obligation.
2. **Social Proof (Bandwagon)**: "Everyone is doing it." Use testimonials, numbers.
3. **Scarcity/FOMO**: Limited availability increases value.
4. **Authority**: Demonstrate expertise or credentials.
5. **Loss Aversion**: Losses hurt 2x more than gains feel good. Frame as "Don't lose" vs "Gain".
6. **Anchoring**: The first number/concept sets the bar.

### JOB
Analyze the input CONTENT.
Apply the requested TRIGGERS (or suggest the best ones for the GOAL).
Rewrite the content to be psychologically potent.

Output JSON:
- enhancedContent: The rewritten version.
- appliedTriggers: List of concepts used.
- explanation: Why this version converts better.
`,
    temperature: 0.5,
    maxTokens: 1000
}
