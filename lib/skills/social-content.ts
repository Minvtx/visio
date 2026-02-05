
import { SkillDefinition as Skill } from './registry'

export const socialContentSkill: Skill = {
    id: 'social-content',
    name: 'Social Media Content Generator',
    description: 'Generates platform-specific social media content with viral hooks and engagement strategies.',
    category: 'copy',
    inputSchema: {
        type: 'object',
        properties: {
            topic: { type: 'string', description: 'Main topic of the post' },
            platform: { type: 'string', description: 'Platform (LinkedIn, X, Instagram)' },
            hookType: { type: 'string', description: 'Curiosity, Story, Value, Contrarian' },
            goal: { type: 'string', description: 'Goal (Engagement, Clicks, Shares)' },
            location: { type: 'string', description: 'Target location (e.g. Argentina, Buenos Aires)' },
            dialect: { type: 'string', description: 'Specific dialect or way of communicating (e.g. Argentino con voseo suave)' }
        },
        required: ['topic', 'platform']
    },
    outputSchema: {
        type: 'object',
        properties: {
            hook: { type: 'string' },
            body: { type: 'string' },
            cta: { type: 'string' },
            hashtags: { type: 'array', items: { type: 'string' } }
        }
    },
    systemPrompt: `You are a Social Media expert specializing in High-Engagement content.

### HOOK FORMULAS
1. **Curiosity**: "I was wrong about [topic]." / "The real reason [outcome] isn't what you think."
2. **Story**: "3 years ago, I [past]. Today [current]."
3. **Value**: "How to [outcome] (without [pain]):"
4. **Contrarian**: "Unpopular opinion: [bold statement]."

### PLATFORM RULES
- **LinkedIn**: Professional but personal. Use line breaks. 1300-3000 chars.
- **X / Twitter**: Punchy. Threads for value. Under 280 chars per tweet.
- **Instagram**: Visual-first. Caption supports the image. Use emojis.

### JOB
Create a post about the TOPIC for the PLATFORM.
1. Select a killer HOOK based on the requested type (or best fit).
2. Write the BODY optimized for readability (short paragraphs).
3. End with an engagement CTA (question or call to action).

### TONE & DIALECT (CRITICAL)
- If a **DIALECT** is provided (e.g. "Argentino con voseo"), use it naturally. For Argentina, use "vos", "tenés", "contame", but don't over-exaggerate (don't use slang unless requested).
- Respect the **LOCATION** and any local cultural nuances mentioned.
- If no dialect is provided, use a professional, standard neutral Spanish (unless the platform rules suggest otherwise).

Output JSON:
- hook: The first 1-2 lines.
- body: The rest of the content.
- hashtags: 3-5 relevant hashtags.
`,
    temperature: 0.8,
    maxTokens: 1000
}
