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

        // Get API key (BYOK or fallback to env)
        let apiKey = process.env.ANTHROPIC_API_KEY

        if (workspaceId) {
            const keys = await getWorkspaceApiKeys(workspaceId)
            if (keys.anthropic) {
                apiKey = keys.anthropic
            }
        }

        if (!apiKey) {
            throw new Error('No hay API Key de Anthropic configurada. Ve a Settings para agregar tu key.')
        }

        const client = new Anthropic({ apiKey })

        const systemPrompt = buildSystemPrompt()
        const userPrompt = buildUserPrompt(brand, brief, plan)

        console.log(`[ContentGenerator] Generating ${plan.posts + plan.carousels + plan.reels + plan.stories} pieces for ${brand.name}...`)

        const MODELS = [
            'claude-3-5-sonnet-20240620', // Tier 1: SOTA
            'claude-3-opus-20240229',     // Tier 2: High Reasoning
            'claude-3-sonnet-20240229',   // Tier 3: Standard Stable
            'claude-3-haiku-20240307'     // Tier 4: Fast Fallback
        ]

        let response: any
        let usedModel = ''

        for (const model of MODELS) {
            try {
                console.log(`[ContentGenerator] Attempting generation with model: ${model}`)
                response = await client.messages.create({
                    model,
                    max_tokens: model.includes('haiku') ? 4096 : 8192,
                    temperature: 0.7,
                    system: systemPrompt,
                    messages: [
                        { role: 'user', content: userPrompt }
                    ]
                })
                usedModel = model
                break // Success, exit loop
            } catch (error: any) {
                console.warn(`[ContentGenerator] Failed with model ${model}:`, error.message)

                // Only retry on specific errors that suggest model unavailability
                const isModelError = error.status === 404 || error.status === 400 || error.error?.type === 'not_found_error'

                if (isModelError && model !== MODELS[MODELS.length - 1]) {
                    console.log(`[ContentGenerator] Falling back to next model...`)
                    continue
                }

                // If it's another error (e.g. auth, rate limit) or last model, throw it
                throw error
            }
        }

        const textContent = response.content.find((c: any) => c.type === 'text')
        if (!textContent || textContent.type !== 'text') {
            throw new Error('No text response from Claude')
        }

        // Parse JSON response safely
        let jsonText = textContent.text.trim()

        // Remove markdown code blocks if present
        if (jsonText.startsWith('```json')) {
            jsonText = jsonText.replace(/^```json\n?/, '').replace(/\n?```$/, '')
        } else if (jsonText.startsWith('```')) {
            jsonText = jsonText.replace(/^```\n?/, '').replace(/\n?```$/, '')
        }

        let result: any
        try {
            result = JSON.parse(jsonText)
        } catch (e) {
            console.warn("[ContentGenerator] JSON parse failed, attempting repair of truncated JSON...", e)
            try {
                // Basic repair for truncated JSON
                // 1. If it ends with specific characters, try to close them
                // This is a naive heuristic but works for simple cut-offs
                let repaired = jsonText
                // Count brackets
                const openBraces = (repaired.match(/{/g) || []).length
                const closeBraces = (repaired.match(/}/g) || []).length
                const openBrackets = (repaired.match(/\[/g) || []).length
                const closeBrackets = (repaired.match(/\]/g) || []).length

                // If we are inside a string (odd number of quotes), close it
                const quotes = (repaired.match(/"/g) || []).length
                if (quotes % 2 !== 0) {
                    repaired += '"'
                }

                // Close arrays and objects
                for (let i = 0; i < (openBrackets - closeBrackets); i++) repaired += ']'
                for (let i = 0; i < (openBraces - closeBraces); i++) repaired += '}'

                result = JSON.parse(repaired)
                console.log("[ContentGenerator] JSON repaired successfully.")
            } catch (repairError) {
                console.error("[ContentGenerator] Fatal: Could not repair JSON.", repairError)
                console.error("[ContentGenerator] Raw Output Hint:", jsonText.slice(-100))
                throw new Error("La IA generó una respuesta inválida o incompleta on JSON. Por favor intenta de nuevo.")
            }
        }

        const tokensUsed = response.usage.input_tokens + response.usage.output_tokens
        const duration = Date.now() - startTime

        console.log(`[ContentGenerator] Generated ${result.pieces.length} pieces in ${duration}ms using ${tokensUsed} tokens (Model: ${usedModel})`)

        return {
            strategy: result.strategy,
            pieces: result.pieces,
            tokensUsed,
            duration
        }
    }
}

export const contentGenerator = new ContentGenerator()
