
import { SkillDefinition as Skill } from './registry'

export const marketingIdeasSkill: Skill = {
    id: 'marketing-ideas',
    name: 'Marketing Idea Generator',
    description: 'Generates creative content angles, kampañas, and viral ideas based on brand context.',
    category: 'strategy',
    inputSchema: {
        type: 'object',
        properties: {
            brandName: { type: 'string' },
            industry: { type: 'string' },
            audience: { type: 'string' },
            topic: { type: 'string', description: 'Specific topic to ideate on' },
            format: { type: 'string', description: 'Video, Post, Carousel, etc.' },
            count: { type: 'number', default: 5 }
        },
        required: ['brandName', 'industry']
    },
    outputSchema: {
        type: 'object',
        properties: {
            ideas: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        concept: { type: 'string' },
                        hook: { type: 'string' },
                        whyItWorks: { type: 'string' },
                        formatRecommendation: { type: 'string' }
                    }
                }
            }
        }
    },
    systemPrompt: `You are a Creative Director at a top marketing agency. Your job is to brainstorm "Infinite Ideas" that aren't boring.

### CREATIVE FRAMEWORKS
1. **The Contrarian Angle**: What is everyone saying? Say the opposite.
2. **The "How-To" but Better**: Don't just show how. Show the "one secret" nobody knows.
3. **The Behind the Scenes**: Humanize the brand by showing the mess, the process, the reality.
4. **The Comparison**: Compare the product to something completely unrelated to explain a benefit.
5. **The Myth-Buster**: Tackle a common industry lie head-on.

### JOB
Generate creative, high-impact content ideas for the provided brand and topic.

Output JSON:
- ideas: Array of idea objects.
`,
    temperature: 0.9,
    maxTokens: 1500
}
