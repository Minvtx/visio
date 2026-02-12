// Content Generator - Simplified Monolithic Agent
// Generates a full month of content in a single API call
// Optimized for cost-efficiency while maintaining quality

import Anthropic from '@anthropic-ai/sdk'
import { getWorkspaceApiKeys } from '../workspace'

export interface BrandContext {
    name: string
    industry: string
    // Identity
    brandPersonality?: string[]
    brandArchetype?: string
    tagline?: string
    valueProposition?: string
    // Voice
    primaryTone: string
    secondaryTone?: string
    speakingAs?: 'yo' | 'nosotros' | 'la marca'
    emojiUsage?: 'ninguno' | 'mínimo' | 'moderado' | 'abundante'
    // Knowledge
    about: string
    products?: Array<{ name: string; description: string }>
    targetAudiences?: Array<{ name: string; description: string }>
    // Guardrails
    guardrails?: string[]
    forbiddenWords?: string[]
    requiredHashtags?: string[]
    forbiddenHashtags?: string[]
}

export interface MonthBrief {
    month: number
    year: number
    primaryObjective?: string
    specificGoal?: string
    seasonality?: string
    relevantDates?: Array<{ date: string; event: string }>
    contentPillars?: Array<{ name: string; percentage: number }>
}

export interface ContentPlan {
    posts: number
    carousels: number
    reels: number
    stories: number
}

export interface GeneratedPiece {
    dayOfMonth: number
    format: 'POST' | 'CAROUSEL' | 'REEL' | 'STORY'
    pillar: string
    topic: string
    hooks: Array<{ text: string; style: string }>
    captionLong: string
    captionShort: string
    hashtags: string[]
    visualBrief: string
    ctas: string[]
    carouselSlides?: Array<{ slideNumber: number; content: string }>
}

export interface MonthStrategy {
    monthlyObjective: string
    pillars: Array<{ name: string; description: string; percentage: number }>
    keyDates: Array<{ date: string; event: string; contentIdea: string }>
}

export interface GenerationResult {
    strategy: MonthStrategy
    pieces: GeneratedPiece[]
    tokensUsed: number
    duration: number
}

const MONTH_NAMES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

const AI_CLICHES = [
    "En el mundo digital de hoy", "Lleva tu negocio al siguiente nivel", "¡Potencia tu marca!",
    "Descubre cómo", "No te pierdas esta oportunidad", "En un mercado cada vez más competitivo",
    "La clave del éxito", "Transforma tu vida", "Sumérgete en", "Desata tu potencial"
]

function buildSystemPrompt(): string {
    return `Eres un Director Creativo y Copywriter Senior de clase mundial, especializado en redes sociales para marcas premium en Latinoamérica.
Tu objetivo es crear contenido que NO PAREZCA IA. Debe tener "alma", ritmo y autenticidad humana.

ROL Y TONO:
- Eres experto en storytelling, persuasión y psicología del consumidor.
- Tu escritura es conversacional, directa y con personalidad.
- Evitas a toda costa el lenguaje corporativo genérico y el "relleno".
- Usas el principio "Show, Don't Tell" (Muestra, no cuentes).

REGLAS DE ORO (MANDATORIAS):
1. **CERO CLICHÉS**: Está PROHIBIDO usar frases como: ${AI_CLICHES.join(", ")}. Si las usas, el contenido será rechazado.
2. **HOOKS IRRESISTIBLES**: El gancho (primera línea) debe interrumpir el scroll. Usa:
   - Afirmaciones controversiales ("Deja de intentar vender...")
   - Preguntas que duelan ("¿Por qué tus clientes te ignoran?")
   - Datos sorprendentes ("El 90% falla en esto...")
   - Historias personales ("Ayer casi pierdo un cliente por esto...")
3. **ESTRUCTURA VISUAL**: Usa párrafos cortos (1-2 frases). Alterna longitudes para dar ritmo. Usa emojis con inteligencia (no satures).
4. **HUMANIDAD RADICAL**: Escribe como si le hablaras a un amigo inteligente, no a una audiencia masiva. Usa jerga apropiada si la marca lo permite.
5. **VALOR REAL**: Cada pieza debe dejar al usuario pensando "Wow, esto me sirve" o "Me identifico totalmente". Nada de consejos vacíos.

INSTRUCCIONES DE FORMATO:
- Genera un mes COMPLETO de contenido.
- Distribuye formatos (Reels, Carruseles, Posts, Stories) de forma estratégica.
- Asegura variedad temática dentro de los pilares de la marca.

OUTPUT:
Responde ÚNICAMENTE con el JSON solicitado. Nada de texto antes o después.`
}

function buildUserPrompt(
    brand: BrandContext,
    brief: MonthBrief,
    plan: ContentPlan
): string {
    const totalPieces = plan.posts + plan.carousels + plan.reels + plan.stories
    const monthName = MONTH_NAMES[brief.month - 1]

    const productsText = brand.products?.length
        ? brand.products.map(p => `• ${p.name}: ${p.description}`).join('\n')
        : 'No especificados'

    const audiencesText = brand.targetAudiences?.length
        ? brand.targetAudiences.map(a => `• ${a.name}: ${a.description}`).join('\n')
        : 'Audiencia general'

    const datesText = brief.relevantDates?.length
        ? brief.relevantDates.map(d => `• ${d.date}: ${d.event}`).join('\n')
        : 'Sin fechas especiales'

    const pillarsText = brief.contentPillars?.length
        ? brief.contentPillars.map(p => `• ${p.name}: ${p.percentage}%`).join('\n')
        : '• Educativo: 40%\n• Engagement: 30%\n• Promocional: 20%\n• Entretenimiento: 10%'

    return `
═══════════════════════════════════════════════════════════════
                      BRIEF DE MARCA
═══════════════════════════════════════════════════════════════

MARCA: ${brand.name}
INDUSTRIA: ${brand.industry}
TAGLINE: ${brand.tagline || 'No definido'}

SOBRE LA MARCA:
${brand.about}

TONO DE VOZ: ${brand.primaryTone}
${brand.secondaryTone ? `TONO SECUNDARIO: ${brand.secondaryTone}` : ''}
HABLA COMO: ${brand.speakingAs || 'nosotros'}
USO DE EMOJIS: ${brand.emojiUsage || 'moderado'}

PERSONALIDAD: ${brand.brandPersonality?.join(', ') || 'Profesional, cercano'}
ARQUETIPO: ${brand.brandArchetype || 'No definido'}

PRODUCTOS/SERVICIOS:
${productsText}

AUDIENCIAS TARGET:
${audiencesText}

GUARDRAILS (evitar):
${brand.guardrails?.length ? brand.guardrails.map(g => `• ${g}`).join('\n') : '• Ninguno especificado'}

PALABRAS PROHIBIDAS: ${brand.forbiddenWords?.join(', ') || 'Ninguna'}
HASHTAGS OBLIGATORIOS: ${brand.requiredHashtags?.join(' ') || 'Ninguno'}
HASHTAGS PROHIBIDOS: ${brand.forbiddenHashtags?.join(' ') || 'Ninguno'}

═══════════════════════════════════════════════════════════════
                      BRIEF DEL MES
═══════════════════════════════════════════════════════════════

MES: ${monthName} ${brief.year}
OBJETIVO PRINCIPAL: ${brief.primaryObjective || 'Aumentar awareness y engagement'}
META ESPECÍFICA: ${brief.specificGoal || 'No definida'}
ESTACIONALIDAD: ${brief.seasonality || 'Normal'}

FECHAS CLAVE:
${datesText}

PILARES DE CONTENIDO:
${pillarsText}

═══════════════════════════════════════════════════════════════
                      PLAN DE CONTENIDO
═══════════════════════════════════════════════════════════════

CANTIDAD TOTAL: ${totalPieces} piezas

DISTRIBUCIÓN POR FORMATO:
• ${plan.posts} Posts
• ${plan.carousels} Carousels
• ${plan.reels} Reels
• ${plan.stories} Stories

═══════════════════════════════════════════════════════════════
                      OUTPUT REQUERIDO
═══════════════════════════════════════════════════════════════

Genera un JSON con esta estructura EXACTA:

{
  "strategy": {
    "monthlyObjective": "Objetivo claro y medible para el mes",
    "pillars": [
      { "name": "Nombre del pilar", "description": "Descripción breve", "percentage": 40 }
    ],
    "keyDates": [
      { "date": "DD/MM", "event": "Nombre del evento", "contentIdea": "Idea de contenido" }
    ]
  },
  "pieces": [
    {
      "dayOfMonth": 1,
      "format": "POST",
      "pillar": "Nombre del pilar",
      "topic": "Tema de la pieza",
      "hooks": [
        { "text": "Hook principal irresistible", "style": "pregunta" },
        { "text": "Hook alternativo", "style": "estadística" },
        { "text": "Otro hook", "style": "declaración" }
      ],
      "captionLong": "Copy completo de 150-250 palabras, listo para publicar. Incluye emojis según el nivel definido. Debe tener introducción, desarrollo y cierre con CTA.",
      "captionShort": "Versión corta del copy en 2-3 líneas máximo",
      "hashtags": ["#hashtag1", "#hashtag2", "#hashtag3", "#hashtag4", "#hashtag5", "#hashtag6", "#hashtag7", "#hashtag8", "#hashtag9", "#hashtag10"],
      "visualBrief": "Descripción clara de la imagen/video: qué elementos, colores, estilo, texto overlay",
      "ctas": ["CTA principal", "CTA alternativo"],
      "carouselSlides": null
    }
  ]
}

NOTAS PARA carouselSlides (solo si format es CAROUSEL):
{
  "carouselSlides": [
    { "slideNumber": 1, "content": "HOOK - Texto que detiene el scroll" },
    { "slideNumber": 2, "content": "Punto 1 con explicación" },
    { "slideNumber": 3, "content": "Punto 2 con explicación" },
    { "slideNumber": 4, "content": "Punto 3 con explicación" },
    { "slideNumber": 5, "content": "CTA final" }
  ]
}

IMPORTANTE:
- Genera EXACTAMENTE ${totalPieces} piezas
- Distribuye en los ${new Date(brief.year, brief.month, 0).getDate()} días del mes
- No repitas temas
- Varía los estilos de hooks
- Respeta los pilares definidos
- Solo JSON, sin texto adicional
`
}

class ContentGenerator {
    /**
     * Generates a full month of content in a single API call
     */
    async generateMonth(
        brand: BrandContext,
        brief: MonthBrief,
        plan: ContentPlan,
        workspaceId?: string
    ): Promise<GenerationResult> {
        const startTime = Date.now()

        // Get API key
        let apiKey = process.env.ANTHROPIC_API_KEY
        if (workspaceId) {
            const keys = await getWorkspaceApiKeys(workspaceId)
            if (keys.anthropic) apiKey = keys.anthropic
        }
        if (!apiKey) throw new Error('No hay API Key de Anthropic configurada.')

        const client = new Anthropic({ apiKey })
        const systemPrompt = buildSystemPrompt()
        const userPrompt = buildUserPrompt(brand, brief, plan)

        console.log(`[ContentGenerator] Generating pieces for ${brand.name}...`)

        const MODELS = [
            'claude-3-5-sonnet-20240620',
            'claude-3-opus-20240229',
            'claude-3-sonnet-20240229'
        ]

        // Define the schema as a Tool
        const contentTool = {
            name: "submit_content_month",
            description: "Submit the generated content for the full month strategy and pieces.",
            input_schema: {
                type: "object",
                properties: {
                    strategy: {
                        type: "object",
                        properties: {
                            monthlyObjective: { type: "string" },
                            pillars: {
                                type: "array",
                                items: {
                                    type: "object",
                                    properties: { name: { type: "string" }, description: { type: "string" }, percentage: { type: "number" } }
                                }
                            },
                            keyDates: {
                                type: "array",
                                items: {
                                    type: "object",
                                    properties: { date: { type: "string" }, event: { type: "string" }, contentIdea: { type: "string" } }
                                }
                            }
                        },
                        required: ["monthlyObjective", "pillars", "keyDates"]
                    },
                    pieces: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                dayOfMonth: { type: "number" },
                                format: { type: "string", enum: ["POST", "CAROUSEL", "REEL", "STORY"] },
                                pillar: { type: "string" },
                                topic: { type: "string" },
                                hooks: {
                                    type: "array",
                                    items: { type: "object", properties: { text: { type: "string" }, style: { type: "string" } } }
                                },
                                captionLong: { type: "string" },
                                captionShort: { type: "string" },
                                hashtags: { type: "array", items: { type: "string" } },
                                visualBrief: { type: "string" },
                                ctas: { type: "array", items: { type: "string" } },
                                carouselSlides: {
                                    type: "array",
                                    items: { type: "object", properties: { slideNumber: { type: "number" }, content: { type: "string" } } }
                                }
                            },
                            required: ["dayOfMonth", "format", "pillar", "topic", "hooks", "captionLong", "captionShort", "hashtags", "visualBrief", "ctas"]
                        }
                    }
                },
                required: ["strategy", "pieces"]
            }
        }

        let result: any
        let usedModel = ''

        for (const model of MODELS) {
            try {
                console.log(`[ContentGenerator] Attempting with model: ${model} (Tools Mode)`)
                const response = await client.messages.create({
                    model,
                    max_tokens: 8192,
                    temperature: 0.7,
                    system: systemPrompt,
                    tools: [contentTool as any],
                    tool_choice: { type: "tool", name: "submit_content_month" },
                    messages: [{ role: 'user', content: userPrompt }]
                })

                // Extract tool use input
                const toolUse = response.content.find(c => c.type === 'tool_use')
                if (toolUse && toolUse.type === 'tool_use') {
                    result = toolUse.input
                    usedModel = model
                    break
                } else {
                    throw new Error("Model did not use the tool correctly.")
                }

            } catch (error: any) {
                console.warn(`[ContentGenerator] Failed with model ${model}:`, error.message)
                const isModelError = error.status === 404 || error.status === 400 || error.error?.type === 'not_found_error'
                if (isModelError && model !== MODELS[MODELS.length - 1]) continue
                throw error
            }
        }

        if (!result) throw new Error("Failed to generate content after retries.")

        const duration = Date.now() - startTime
        console.log(`[ContentGenerator] Success! Generated ${result.pieces?.length || 0} pieces in ${duration}ms (Model: ${usedModel})`)

        return {
            strategy: result.strategy,
            pieces: result.pieces,
            tokensUsed: 0, // Tools usage not strictly counted same way, simpler to omit or approx
            duration
        }
    }
}

export const contentGenerator = new ContentGenerator()
