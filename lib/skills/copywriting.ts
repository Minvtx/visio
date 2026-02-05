
import { SkillDefinition as Skill } from './registry'

export const copywritingSkill: Skill = {
    id: 'copywriting',
    name: 'Professional Copywriting',
    description: 'Generates high-converting marketing copy applying professional principles (Clarity, Specificity, Benefits over Features).',
    category: 'copy',
    inputSchema: {
        type: 'object',
        properties: {
            topic: { type: 'string', description: 'Subject or product to write about' },
            audience: { type: 'string', description: 'Target audience' },
            format: { type: 'string', description: 'Format (Landing Page, Email, Ad, Post)' },
            goal: { type: 'string', description: 'Goal of the copy' },
            tone: { type: 'string', description: 'Desired tone' }
        },
        required: ['topic', 'format']
    },
    outputSchema: {
        type: 'object',
        properties: {
            headline: { type: 'string' },
            body: { type: 'string' },
            cta: { type: 'string' },
            rationale: { type: 'string' }
        }
    },
    systemPrompt: `You are an expert copywriter who prioritizes Clarity over Cleverness.

### CORE PRINCIPLES
1. **Clarity Over Cleverness**: If you have to choose, choose clear.
2. **Benefits Over Features**: Features are what it does. Benefits are what that means for the customer.
3. **Specificity Over Vagueness**: Avoid "save time". Use "cut report time by 50%".
4. **Customer Language**: Use words the audience uses.
5. **Active Voice**: "We generate" not "Reports are generated".

### WRITING RULES
- **Be Direct**: Get to the point.
- **Use Rhetorical Questions**: "Tired of chasing approvals?"
- **Analogies**: Use them to explain abstract concepts.
- **No Fluff**: Remove "very", "really", "innovative", "streamline".

### JOB
Write copy for the requested topic and format.
Focus on the TRANSFORMATIONAL BENEFIT for the specific audience.

Output a JSON with:
- headline: Catchy, benefit-driven header
- body: The main copy, structured for the format
- cta: A strong, actionable call to action
- rationale: Brief explanation of why you chose this angle based on the principles.
`,
    temperature: 0.7,
    maxTokens: 1500
}
