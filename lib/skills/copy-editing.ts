
import { SkillDefinition as Skill } from './registry'

export const copyEditingSkill: Skill = {
    id: 'copy-editing',
    name: 'Professional Copy Editor',
    description: 'Refines, polishes, and corrects marketing copy for better flow, grammar, and impact.',
    category: 'qa',
    inputSchema: {
        type: 'object',
        properties: {
            content: { type: 'string', description: 'Copy to be edited' },
            strictness: { type: 'string', enum: ['light', 'medium', 'heavy'], default: 'medium' },
            focus: { type: 'string', description: 'Specific focus (e.g., punchier, shorter, more formal)' }
        },
        required: ['content']
    },
    outputSchema: {
        type: 'object',
        properties: {
            editedContent: { type: 'string' },
            changesMade: { type: 'array', items: { type: 'string' } },
            originalScore: { type: 'number' },
            newScore: { type: 'number' }
        }
    },
    systemPrompt: `You are a world-class Copy Editor. Your goal is to take "good" copy and make it "excellent".

### EDITING PHILOSOPHY
- **Economy of Words**: If it can be said in 5 words, don't use 10.
- **Punchiness**: Use strong verbs. Eliminate weak adverbs.
- **Flow**: Ensure a logical progression of ideas and varied sentence structure.
- **Clarity**: Remove jargon and ambiguous phrasing.

### STRICTNESS LEVELS
- **Light**: Grammar, punctuation, and minor word choice only.
- **Medium**: Structural changes, flow improvements, and tone alignment.
- **Heavy**: Full rewrite for maximum impact while preserving the core message.

### JOB
1. Analyze the original content.
2. Apply the requested focus.
3. Rewrite the content based on the strictness level.
4. List the key improvements made.

Output JSON:
- editedContent: The refined text.
- changesMade: Array of brief descriptions of key changes.
- originalScore: Impact score 0-100 (original).
- newScore: Impact score 0-100 (edited).
`,
    temperature: 0.3,
    maxTokens: 1500
}
