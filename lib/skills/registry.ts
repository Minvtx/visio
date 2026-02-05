// Skill Registry - Core system for Content Studio AI
// Each skill is a modular unit with defined inputs/outputs

import Anthropic from '@anthropic-ai/sdk'
import { copywritingSkill } from './copywriting'
import { socialContentSkill } from './social-content'
import { marketingPsychologySkill } from './marketing-psychology'
import { brandGuidelinesSkill } from './brand-guidelines'
import { copyEditingSkill } from './copy-editing'
import { humanizerSkill } from './humanizer'
import { marketingIdeasSkill } from './marketing-ideas'
import { getWorkspaceApiKeys } from '../workspace'


export interface SkillDefinition {
    id: string
    name: string
    category: 'strategy' | 'copy' | 'visual' | 'qa' | 'utility'
    description: string
    inputSchema: Record<string, unknown>
    outputSchema: Record<string, unknown>
    systemPrompt: string
    temperature: number
    maxTokens: number
}

export interface SkillResult<T = unknown> {
    success: boolean
    output: T
    tokensUsed: number
    duration: number
    error?: string
}

export interface SkillExecutionLog {
    skillId: string
    input: Record<string, unknown>
    output: unknown
    tokensUsed: number
    duration: number
    success: boolean
    error?: string
    timestamp: Date
}

class SkillRegistry {
    private skills: Map<string, SkillDefinition> = new Map()
    private anthropic: Anthropic | null = null
    private executionLogs: SkillExecutionLog[] = []

    constructor() {
        this.registerCoreSkills()
    }

    private getClient(): Anthropic {
        if (!this.anthropic) {
            this.anthropic = new Anthropic({
                apiKey: process.env.ANTHROPIC_API_KEY,
            })
        }
        return this.anthropic
    }

    register(skill: SkillDefinition): void {
        this.skills.set(skill.id, skill)
    }

    get(id: string): SkillDefinition | undefined {
        return this.skills.get(id)
    }

    list(category?: string): SkillDefinition[] {
        const all = Array.from(this.skills.values())
        if (category) {
            return all.filter((s) => s.category === category)
        }
        return all
    }

    getExecutionLogs(): SkillExecutionLog[] {
        return this.executionLogs
    }

    clearLogs(): void {
        this.executionLogs = []
    }

    async invoke<T>(skillId: string, input: Record<string, unknown>): Promise<SkillResult<T>> {
        const skill = this.skills.get(skillId)
        if (!skill) {
            return { success: false, output: null as T, tokensUsed: 0, duration: 0, error: `Skill not found: ${skillId}` }
        }

        const startTime = Date.now()

        try {
            const client = this.getClient()
            const response = await client.messages.create({
                model: 'claude-3-5-sonnet-20241022',
                max_tokens: skill.maxTokens,
                temperature: skill.temperature,
                system: skill.systemPrompt,
                messages: [
                    {
                        role: 'user',
                        content: `Input:\n${JSON.stringify(input, null, 2)}\n\nResponde SOLO con JSON válido según el schema de output.`,
                    },
                ],
            })

            const textContent = response.content.find((c) => c.type === 'text')
            if (!textContent || textContent.type !== 'text') {
                throw new Error('No text response from Claude')
            }

            // Extract JSON from response - handle both bare JSON and JSON blocks
            let jsonText = textContent.text.trim()

            // Remove markdown code block if present
            if (jsonText.startsWith('```json')) {
                jsonText = jsonText.replace(/^```json\n?/, '').replace(/\n?```$/, '')
            } else if (jsonText.startsWith('```')) {
                jsonText = jsonText.replace(/^```\n?/, '').replace(/\n?```$/, '')
            }

            const jsonMatch = jsonText.match(/\{[\s\S]*\}/)
            if (!jsonMatch) {
                throw new Error('No valid JSON in response')
            }

            const output = JSON.parse(jsonMatch[0]) as T
            const tokensUsed = response.usage.input_tokens + response.usage.output_tokens
            const duration = Date.now() - startTime

            // Log execution
            this.executionLogs.push({
                skillId,
                input,
                output,
                tokensUsed,
                duration,
                success: true,
                timestamp: new Date(),
            })

            return { success: true, output, tokensUsed, duration }
        } catch (error) {
            const duration = Date.now() - startTime
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'

            // Log failed execution
            this.executionLogs.push({
                skillId,
                input,
                output: null,
                tokensUsed: 0,
                duration,
                success: false,
                error: errorMessage,
                timestamp: new Date(),
            })

            return {
                success: false,
                output: null as T,
                tokensUsed: 0,
                duration,
                error: errorMessage,
            }
        }
    }

    // Batch invoke multiple skills in parallel
    async invokeParallel<T>(
        invocations: Array<{ skillId: string; input: Record<string, unknown> }>
    ): Promise<Array<SkillResult<T>>> {
        const promises = invocations.map((inv) => this.invoke<T>(inv.skillId, inv.input))
        return Promise.all(promises)
    }

    /**
     * Invoke a skill using the API Key configured for a specific workspace.
     * This is the BYOK (Bring Your Own Key) implementation.
     */
    async invokeWithWorkspace<T>(
        skillId: string,
        input: Record<string, unknown>,
        workspaceId: string
    ): Promise<SkillResult<T>> {
        const skill = this.skills.get(skillId)
        if (!skill) {
            return { success: false, output: null as T, tokensUsed: 0, duration: 0, error: `Skill not found: ${skillId}` }
        }

        const startTime = Date.now()

        try {
            // Get API keys for the workspace
            const apiKeys = await getWorkspaceApiKeys(workspaceId)

            if (!apiKeys.anthropic) {
                throw new Error('No hay API Key de Anthropic configurada. Ve a Settings para agregar tu key.')
            }

            // Create client with workspace's API key
            const client = new Anthropic({
                apiKey: apiKeys.anthropic,
            })

            const response = await client.messages.create({
                model: 'claude-3-5-sonnet-20241022',
                max_tokens: skill.maxTokens,
                temperature: skill.temperature,
                system: skill.systemPrompt,
                messages: [
                    {
                        role: 'user',
                        content: `Input:\n${JSON.stringify(input, null, 2)}\n\nResponde SOLO con JSON válido según el schema de output.`,
                    },
                ],
            })

            const textContent = response.content.find((c) => c.type === 'text')
            if (!textContent || textContent.type !== 'text') {
                throw new Error('No text response from Claude')
            }

            // Extract JSON from response
            let jsonText = textContent.text.trim()
            if (jsonText.startsWith('```json')) {
                jsonText = jsonText.replace(/^```json\n?/, '').replace(/\n?```$/, '')
            } else if (jsonText.startsWith('```')) {
                jsonText = jsonText.replace(/^```\n?/, '').replace(/\n?```$/, '')
            }

            const jsonMatch = jsonText.match(/\{[\s\S]*\}/)
            if (!jsonMatch) {
                throw new Error('No valid JSON in response')
            }

            const output = JSON.parse(jsonMatch[0]) as T
            const tokensUsed = response.usage.input_tokens + response.usage.output_tokens
            const duration = Date.now() - startTime

            // Log execution
            this.executionLogs.push({
                skillId,
                input,
                output,
                tokensUsed,
                duration,
                success: true,
                timestamp: new Date(),
            })

            return { success: true, output, tokensUsed, duration }
        } catch (error) {
            const duration = Date.now() - startTime
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'

            this.executionLogs.push({
                skillId,
                input,
                output: null,
                tokensUsed: 0,
                duration,
                success: false,
                error: errorMessage,
                timestamp: new Date(),
            })

            return {
                success: false,
                output: null as T,
                tokensUsed: 0,
                duration,
                error: errorMessage,
            }
        }
    }


    private registerCoreSkills(): void {
        // ═══════════════════════════════════════════════════════════
        // STRATEGY SKILLS
        // ═══════════════════════════════════════════════════════════

        // Brand Snapshot Skill
        this.register({
            id: 'brand_snapshot',
            name: 'Brand Snapshot Generator',
            category: 'strategy',
            description: 'Genera un resumen estratégico de la marca para informar otras skills',
            inputSchema: {
                type: 'object',
                required: ['brandName', 'industry', 'about'],
                properties: {
                    brandName: { type: 'string' },
                    industry: { type: 'string' },
                    about: { type: 'string' },
                    tone: { type: 'string' },
                    targetAudiences: { type: 'array' },
                    products: { type: 'array' },
                    competitors: { type: 'array' },
                },
            },
            outputSchema: {
                type: 'object',
                properties: {
                    summary: { type: 'string' },
                    uniqueValue: { type: 'string' },
                    audiences: { type: 'array' },
                    contentOpportunities: { type: 'array' },
                    toneRecommendation: { type: 'string' },
                    keyThemes: { type: 'array' },
                },
            },
            systemPrompt: `Eres un estratega de marca y contenidos experto.
Tu trabajo es analizar la información de una marca y generar un "snapshot" estratégico que servirá para informar la creación de contenido.

DEBES INCLUIR:
1. Resumen ejecutivo de la marca (2-3 oraciones que capturen su esencia)
2. Propuesta de valor única (qué los hace diferentes)
3. Segmentos de audiencia principales (3-5 perfiles con sus dolores y deseos)
4. Oportunidades de contenido (5-7 temas/ángulos únicos para explotar)
5. Recomendación de tono de comunicación (con ejemplos concretos)
6. Temas clave que pueden usar una y otra vez

Sé específico y accionable. Esto será usado por otros sistemas para generar contenido.

Responde en JSON estructurado.`,
            temperature: 0.6,
            maxTokens: 1500,
        })

        // Monthly Strategy Skill
        this.register({
            id: 'monthly_strategy',
            name: 'Monthly Strategy Generator',
            category: 'strategy',
            description: 'Define la estrategia de contenido para un mes específico',
            inputSchema: {
                type: 'object',
                required: ['brandSnapshot', 'month', 'year'],
                properties: {
                    brandSnapshot: { type: 'object' },
                    month: { type: 'number' },
                    year: { type: 'number' },
                    primaryObjective: { type: 'string' },
                    specificGoal: { type: 'string' },
                    relevantDates: { type: 'array' },
                    activeCampaigns: { type: 'array' },
                    contentPillars: { type: 'array' },
                    strategicInputs: { type: 'array', description: 'Specific topics or context provided by the user' },
                    country: { type: 'string' },
                    city: { type: 'string' },
                    dialect: { type: 'string' },
                },
            },
            outputSchema: {
                type: 'object',
                properties: {
                    monthlyObjective: { type: 'string' },
                    pillars: { type: 'array' },
                    keyDates: { type: 'array', items: { type: 'object', properties: { date: { type: 'string' }, event: { type: 'string' }, importance: { type: 'string' }, recommendation: { type: 'string' } } } },
                    strategicIntegration: { type: 'array', items: { type: 'string' }, description: 'How to integrate the strategic inputs into the month' },
                    audienceInsights: { type: 'array' },
                    contentMix: { type: 'object' },
                },
            },
            systemPrompt: `Eres un estratega de contenido para redes sociales experto en marketing localizado.
Tu trabajo es definir la estrategia mensual de contenido basándote en el análisis de marca, los objetivos del mes y el contexto local.

### CONTEXTO LOCAL (CRITICAL)
- Ubicación: CONSIDERA EL PAÍS Y CIUDAD ({country}, {city}). Los días festivos, estaciones del año (invierno/verano) y eventos culturales varían por país.
- Dialecto: Si se especifica un DIALECTO ({dialect}), la estrategia debe contemplar cómo se comunicará la marca este mes respetando esas sutilezas lingüísticas.

### INPUTS ESTRATÉGICOS
- El usuario te ha dado temas específicos, fotos o eventos que quiere cubrir ({strategicInputs}). Es OBLIGATORIO integrar estos eventos en la estrategia del mes.

### DEBES INCLUIR EN EL OUTPUT:
1. Objetivo mensual claro y medible.
2. pilares de contenido (con porcentajes).
3. Fechas clave: Incluye fechas clave nacionales para el país indicado y fechas sugeridas por el usuario.
4. Integración estratégica: Explica cómo se usarán los inputs específicos del usuario.
5. Insights de audiencia: Qué espera la audiencia en esa ubicación ({country}) durante este mes específico.

Responde en JSON estructurado.`,
            temperature: 0.6,
            maxTokens: 1200,
        })

        // Content Calendar Skill
        this.register({
            id: 'content_calendar',
            name: 'Content Calendar Generator',
            category: 'strategy',
            description: 'Crea el calendario de contenido con temas y formatos por día',
            inputSchema: {
                type: 'object',
                required: ['strategy', 'plan', 'month', 'year'],
                properties: {
                    strategy: { type: 'object' },
                    plan: { type: 'object' },
                    month: { type: 'number' },
                    year: { type: 'number' },
                    daysInMonth: { type: 'number' },
                },
            },
            outputSchema: {
                type: 'object',
                properties: {
                    pieces: { type: 'array' },
                },
            },
            systemPrompt: `Eres un planificador de contenido experto.
Tu trabajo es crear un calendario de publicaciones para el mes, distribuyendo las piezas estratégicamente.

REGLAS:
1. Distribuye contenido de forma equilibrada (evita días vacíos y días sobrecargados)
2. Los mejores días para engagement: Martes, Miércoles, Jueves
3. Reels tienen mejor rendimiento al inicio de semana
4. Carruseles funcionan mejor a mitad de semana
5. Stories pueden ir cualquier día
6. No publiques más de 2 piezas por día

Para cada pieza indica:
- dayOfMonth (número del día)
- format (POST, CAROUSEL, REEL, STORY)
- pillar (pilar de contenido al que pertenece)
- topic (tema específico de la pieza)
- objective (AWARENESS, ENGAGEMENT, CONVERSION, COMMUNITY)
- suggestedTime (hora sugerida HH:MM)

Responde con un JSON que tenga un array "pieces".`,
            temperature: 0.5,
            maxTokens: 3000,
        })

        // ═══════════════════════════════════════════════════════════
        // COPY SKILLS
        // ═══════════════════════════════════════════════════════════

        // Hook Variants Skill
        this.register({
            id: 'hook_variants',
            name: 'Hook Variants Generator',
            category: 'copy',
            description: 'Genera múltiples variantes de hooks para captar atención',
            inputSchema: {
                type: 'object',
                required: ['topic', 'format', 'brandTone'],
                properties: {
                    topic: { type: 'string' },
                    format: { type: 'string', enum: ['POST', 'CAROUSEL', 'REEL', 'STORY'] },
                    brandTone: { type: 'string' },
                    objective: { type: 'string' },
                    targetAudience: { type: 'string' },
                    count: { type: 'number', default: 5 },
                },
            },
            outputSchema: {
                type: 'object',
                properties: {
                    hooks: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                text: { type: 'string' },
                                style: { type: 'string' },
                                reasoning: { type: 'string' },
                            },
                        },
                    },
                },
            },
            systemPrompt: `Eres un experto en copywriting para redes sociales con especialización en hooks virales.

Tu trabajo es generar hooks que DETENGAN EL SCROLL instantáneamente.

ESTILOS DE HOOK:
1. QUESTION - Pregunta intrigante que hace pensar
2. STATEMENT - Afirmación audaz o contraintuitiva
3. STATISTIC - Dato impactante o estadística
4. STORY - Inicio de micro-historia personal
5. CURIOSITY - Genera curiosidad sin revelar todo
6. BENEFIT - Promesa de beneficio directo
7. PAIN - Menciona un dolor/problema común

REGLAS:
- Máximo 150 caracteres por hook
- Mantén el tono de marca especificado
- No uses clichés ("¿Sabías que...", "En este post...")
- Cada hook debe ser único y memorable
- Debe funcionar para el formato especificado

Responde SIEMPRE en JSON:
{
  "hooks": [
    { "text": "...", "style": "question|statement|...", "reasoning": "Por qué funciona este hook" }
  ]
}`,
            temperature: 0.85,
            maxTokens: 1000,
        })

        // Caption Long Skill
        this.register({
            id: 'caption_long',
            name: 'Long Caption Generator',
            category: 'copy',
            description: 'Genera captions extensos y engaging para posts y carruseles',
            inputSchema: {
                type: 'object',
                required: ['hook', 'topic', 'brandTone'],
                properties: {
                    hook: { type: 'string' },
                    topic: { type: 'string' },
                    brandTone: { type: 'string' },
                    objective: { type: 'string' },
                    targetAudience: { type: 'string' },
                    keyPoints: { type: 'array', items: { type: 'string' } },
                    productMention: { type: 'string' },
                    guardrails: { type: 'array' },
                },
            },
            outputSchema: {
                type: 'object',
                properties: {
                    caption: { type: 'string' },
                    wordCount: { type: 'number' },
                    structure: { type: 'array' },
                },
            },
            systemPrompt: `Eres un experto en copywriting para redes sociales.
Tu trabajo es escribir captions extensos (150-300 palabras) que mantienen la atención y generan engagement.

ESTRUCTURA OBLIGATORIA:
1. HOOK (usar el proporcionado como primera línea)
2. DESARROLLO - Expande el tema con valor real
3. STORYTELLING o DATOS - Conecta emocionalmente o sorprende
4. CTA SUTIL - Invita a una acción sin ser pushy
5. P.S. - Dato extra, pregunta o gancho final

REGLAS:
- Mantén el tono de marca EN CADA PALABRA
- Usa saltos de línea para legibilidad móvil
- Emojis estratégicos (no excesivos, 3-5 max)
- NO incluyas hashtags en el caption
- Evita frases vacías o de relleno
- Respeta los guardrails si se proporcionan

Responde en JSON:
{
  "caption": "El texto completo con saltos de línea",
  "wordCount": 200,
  "structure": ["hook", "desarrollo", "storytelling", "cta", "ps"]
}`,
            temperature: 0.7,
            maxTokens: 1500,
        })

        // Caption Short Skill
        this.register({
            id: 'caption_short',
            name: 'Short Caption Generator',
            category: 'copy',
            description: 'Genera captions cortos para Stories y Reels',
            inputSchema: {
                type: 'object',
                required: ['topic', 'brandTone', 'format'],
                properties: {
                    topic: { type: 'string' },
                    brandTone: { type: 'string' },
                    format: { type: 'string' },
                    hook: { type: 'string' },
                    cta: { type: 'string' },
                },
            },
            outputSchema: {
                type: 'object',
                properties: {
                    caption: { type: 'string' },
                    characterCount: { type: 'number' },
                },
            },
            systemPrompt: `Eres un experto en copywriting corto para redes sociales.
Tu trabajo es escribir captions de MÁXIMO 50 palabras optimizados para Stories y Reels.

CARACTERÍSTICAS:
- Directo al punto
- Impactante desde la primera palabra
- Con gancho emocional
- Incluye CTA cuando sea relevante
- Usa 1-2 emojis max

NO incluyas hashtags. Responde en JSON:
{
  "caption": "...",
  "characterCount": 120
}`,
            temperature: 0.75,
            maxTokens: 400,
        })

        // CTA Variants Skill
        this.register({
            id: 'cta_variants',
            name: 'CTA Variants Generator',
            category: 'copy',
            description: 'Genera múltiples llamadas a la acción',
            inputSchema: {
                type: 'object',
                required: ['objective', 'brandTone'],
                properties: {
                    objective: { type: 'string' },
                    brandTone: { type: 'string' },
                    topic: { type: 'string' },
                    targetAction: { type: 'string' },
                },
            },
            outputSchema: {
                type: 'object',
                properties: {
                    ctas: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                text: { type: 'string' },
                                type: { type: 'string' },
                            },
                        },
                    },
                },
            },
            systemPrompt: `Eres experto en CTAs para redes sociales.
Genera 3-5 CTAs que inviten a la acción sin ser agresivos.

TIPOS DE CTA:
- ENGAGEMENT (comenta, guarda, comparte)
- CLICK (link en bio, desliza)
- CONVERSATIONAL (pregunta que invite a comentar)
- SOFT SELL (sin ser pushy)

Responde en JSON:
{
  "ctas": [
    { "text": "...", "type": "engagement|click|conversational|soft_sell" }
  ]
}`,
            temperature: 0.7,
            maxTokens: 500,
        })

        // Hashtag Set Skill
        this.register({
            id: 'hashtag_set',
            name: 'Hashtag Set Generator',
            category: 'copy',
            description: 'Genera un set optimizado de hashtags',
            inputSchema: {
                type: 'object',
                required: ['topic', 'industry'],
                properties: {
                    topic: { type: 'string' },
                    industry: { type: 'string' },
                    niche: { type: 'string' },
                    requiredHashtags: { type: 'array' },
                    forbiddenHashtags: { type: 'array' },
                },
            },
            outputSchema: {
                type: 'object',
                properties: {
                    hashtags: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                tag: { type: 'string' },
                                category: { type: 'string' },
                            },
                        },
                    },
                },
            },
            systemPrompt: `Eres un experto en estrategia de hashtags para Instagram.

REGLAS PARA SET OPTIMIZADO (10-15 hashtags):
- 3-4 hashtags grandes (500k-2M posts) para alcance
- 4-5 hashtags medianos (50k-500k posts) para visibilidad
- 3-4 hashtags de nicho (<50k posts) para comunidad específica
- 1-2 hashtags de marca si aplica

INCLUIR los hashtags requeridos si se proporcionan.
EXCLUIR los hashtags prohibidos.

Responde en JSON:
{
  "hashtags": [
    { "tag": "sinElHashtag", "category": "big|medium|niche|brand" }
  ]
}`,
            temperature: 0.5,
            maxTokens: 600,
        })

        // ═══════════════════════════════════════════════════════════
        // VISUAL SKILLS
        // ═══════════════════════════════════════════════════════════

        // Visual Prompt Generator
        this.register({
            id: 'visual_prompt',
            name: 'Visual Prompt Generator',
            category: 'visual',
            description: 'Genera prompts detallados para el diseñador o IA de imágenes',
            inputSchema: {
                type: 'object',
                required: ['topic', 'format', 'brandStyle'],
                properties: {
                    topic: { type: 'string' },
                    format: { type: 'string' },
                    brandStyle: { type: 'string' },
                    colorPalette: { type: 'array' },
                    hook: { type: 'string' },
                    caption: { type: 'string' },
                },
            },
            outputSchema: {
                type: 'object',
                properties: {
                    visualConcept: { type: 'string' },
                    mainElements: { type: 'array' },
                    mood: { type: 'string' },
                    colorRecommendation: { type: 'string' },
                    textOverlay: { type: 'string' },
                },
            },
            systemPrompt: `Eres un director creativo visual para redes sociales.
Tu trabajo es crear briefs visuales detallados para diseñadores.

INCLUYE EN TU RESPUESTA:
1. Concepto visual (descripción de la imagen/video)
2. Elementos principales (qué debe aparecer)
3. Mood/atmósfera (el sentimiento que debe transmitir)
4. Colores recomendados
5. Texto overlay (si aplica, qué texto va sobre la imagen)

Para CARRUSELES, describe cada slide por separado.
Para REELS, describe la secuencia visual.

Sé específico y accionable. El diseñador debe poder ejecutar sin dudas.

Responde en JSON estructurado.`,
            temperature: 0.7,
            maxTokens: 1000,
        })

        // Carousel Slides Skill
        this.register({
            id: 'carousel_slides',
            name: 'Carousel Slides Generator',
            category: 'visual',
            description: 'Genera el contenido de cada slide de un carrusel',
            inputSchema: {
                type: 'object',
                required: ['topic', 'hook', 'numberOfSlides'],
                properties: {
                    topic: { type: 'string' },
                    hook: { type: 'string' },
                    numberOfSlides: { type: 'number' },
                    brandTone: { type: 'string' },
                    keyPoints: { type: 'array' },
                },
            },
            outputSchema: {
                type: 'object',
                properties: {
                    slides: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                slideNumber: { type: 'number' },
                                content: { type: 'string' },
                                purpose: { type: 'string' },
                                visualNote: { type: 'string' },
                            },
                        },
                    },
                },
            },
            systemPrompt: `Eres un experto en carruseles virales de Instagram.

ESTRUCTURA GANADORA:
1. SLIDE 1 (HOOK): Engancha con el hook, crea intriga
2. SLIDES 2-N (VALOR): Desarrolla el contenido, cada slide = 1 idea
3. SLIDE FINAL (CTA): Cierra con llamada a la acción

REGLAS POR SLIDE:
- Máximo 30-40 palabras por slide
- Texto legible en móvil
- Cada slide debe tener valor propio
- Variedad visual (no todos los slides iguales)

Responde en JSON:
{
  "slides": [
    { "slideNumber": 1, "content": "...", "purpose": "hook", "visualNote": "..." }
  ]
}`,
            temperature: 0.7,
            maxTokens: 1200,
        })

        // ═══════════════════════════════════════════════════════════
        // QA SKILLS
        // ═══════════════════════════════════════════════════════════

        // Redundancy Check Skill
        this.register({
            id: 'redundancy_check',
            name: 'Redundancy Checker',
            category: 'qa',
            description: 'Detecta repeticiones y redundancias en el contenido del mes',
            inputSchema: {
                type: 'object',
                required: ['pieces'],
                properties: {
                    pieces: { type: 'array' },
                },
            },
            outputSchema: {
                type: 'object',
                properties: {
                    issues: { type: 'array' },
                    score: { type: 'number' },
                    recommendations: { type: 'array' },
                },
            },
            systemPrompt: `Eres un editor de contenido experto en calidad.
Tu trabajo es revisar un conjunto de piezas de contenido y detectar:

1. REPETICIONES - Hooks o estructuras muy similares
2. TEMAS DUPLICADOS - Mismo ángulo en diferentes piezas
3. FATIGA DE FORMATO - Demasiadas piezas seguidas del mismo tipo
4. GAPS - Pilares o temas no cubiertos
5. INCONSISTENCIAS - Tono diferente entre piezas

RESPONDE EN JSON:
{
  "issues": [
    { "type": "repetition|duplicate|fatigue|gap|inconsistency", "pieces": [ids], "description": "..." }
  ],
  "score": 85, // 0-100 donde 100 es perfecto
  "recommendations": ["Sugerencia 1", "Sugerencia 2"]
}`,
            temperature: 0.4,
            maxTokens: 1000,
        })

        // Brand Voice Check Skill
        this.register({
            id: 'brand_voice_check',
            name: 'Brand Voice Checker',
            category: 'qa',
            description: 'Verifica que el contenido esté alineado con la voz de marca',
            inputSchema: {
                type: 'object',
                required: ['content', 'brandTone', 'brandPersonality'],
                properties: {
                    content: { type: 'string' },
                    brandTone: { type: 'string' },
                    brandPersonality: { type: 'array' },
                    forbiddenWords: { type: 'array' },
                    guardrails: { type: 'array' },
                },
            },
            outputSchema: {
                type: 'object',
                properties: {
                    aligned: { type: 'boolean' },
                    score: { type: 'number' },
                    issues: { type: 'array' },
                    suggestions: { type: 'array' },
                },
            },
            systemPrompt: `Eres un guardián de marca experto.
Tu trabajo es verificar que el contenido esté 100% alineado con la voz de marca.

REVISA:
1. ¿El tono es consistente con el especificado?
2. ¿La personalidad se refleja en el copy?
3. ¿Hay palabras prohibidas?
4. ¿Se respetan los guardrails?

Responde en JSON:
{
  "aligned": true/false,
  "score": 90,
  "issues": ["Problema encontrado"],
  "suggestions": ["Cómo mejorarlo"]
}`,
            temperature: 0.3,
            maxTokens: 600,
        })

        // Local Dates Suggestion Skill
        this.register({
            id: 'local_dates',
            name: 'Local Dates Suggester',
            category: 'strategy',
            description: 'Sugiere efemérides y fechas clave basadas en país y mes',
            inputSchema: {
                type: 'object',
                required: ['country', 'month', 'year'],
                properties: {
                    country: { type: 'string' },
                    city: { type: 'string' },
                    month: { type: 'number' },
                    year: { type: 'number' },
                    industry: { type: 'string' },
                },
            },
            outputSchema: {
                type: 'object',
                properties: {
                    dates: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                date: { type: 'string', description: 'YYYY-MM-DD' },
                                event: { type: 'string' },
                                relevance: { type: 'string' },
                                contentIdea: { type: 'string' },
                            },
                        },
                    },
                },
            },
            systemPrompt: `Eres un experto en cultura local y marketing estacional.
Tu trabajo es identificar las fechas más importantes del mes para una ubicación específica ({country}).

DEBES INCLUIR:
1. Días festivos nacionales y locales.
2. Días internacionales relevantes (Ej: Día del Medio Ambiente).
3. Eventos de la industria (si se menciona).
4. Fenómenos culturales o deportivos relevantes.

Para cada fecha, sugiere una idea rápida de contenido.
Responde SIEMPRE en JSON.`,
            temperature: 0.5,
            maxTokens: 800,
        })

        // ═══════════════════════════════════════════════════════════
        // SKILLS.SH IMPORTED SKILLS (PHASE 1)
        // ═══════════════════════════════════════════════════════════
        this.register(copywritingSkill)
        this.register(socialContentSkill)
        this.register(marketingPsychologySkill)
        this.register(brandGuidelinesSkill)

        // ═══════════════════════════════════════════════════════════
        // SKILLS.SH IMPORTED SKILLS (PHASE 2)
        // ═══════════════════════════════════════════════════════════
        this.register(copyEditingSkill)
        this.register(humanizerSkill)
        this.register(marketingIdeasSkill)
    }
}

// Singleton instance
export const skillRegistry = new SkillRegistry()
