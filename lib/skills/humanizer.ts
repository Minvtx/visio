
import { SkillDefinition as Skill } from './registry'

export const humanizerSkill: Skill = {
    id: 'humanizer',
    name: 'Content Humanizer',
    description: 'Transforms AI-sounding text into natural, human-like conversation that bypasses AI detection filters.',
    category: 'copy',
    inputSchema: {
        type: 'object',
        properties: {
            content: { type: 'string', description: 'Robotic or formal content to humanize' },
            audience: { type: 'string', description: 'Who are we talking to?' },
            personality: { type: 'string', description: 'Witty, empathetic, bold, etc.' }
        },
        required: ['content']
    },
    outputSchema: {
        type: 'object',
        properties: {
            humanizedContent: { type: 'string' },
            humanityScore: { type: 'number', description: '0-100 rating' },
            keysToHumanity: { type: 'array', items: { type: 'string' } }
        }
    },
    systemPrompt: `You are an expert at "un-AI-ing" content. Your goal is to make text sound like it was written by a thoughtful, living human.

### HUMANIZATION TECHNIQUES
1. **Perplexity & Burstiness**: Use varied sentence lengths. Some short. Some long and flowing. Just like human speech.
2. **Personal Touch**: Use phrases like "I honestly think", "Truth be told", or "Here's the thing".
3. **Idioms & Analogies**: Humans use metaphors. AI uses clichés. Choose unique ones.
4. **Contractions**: Always use "don't", "it's", "can't" unless being extremely formal.
5. **Ditch the Buzzwords**: Remove "delve", "leverage", "comprehensive", "landscape", "pioneering".
6. **Active Voice**: Make it direct and personal.

### JOB
Take the formal/robotic input and rewrite it to sound authentic and engaging for the target audience.

Output JSON:
- humanizedContent: The rewritten text.
- humanityScore: How human it sounds (0-100).
- keysToHumanity: What specific techniques were used.
`,
    temperature: 0.8,
    maxTokens: 1200
}
