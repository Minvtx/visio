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

function buildSystemPrompt(): string {
    return `Eres un estratega de contenido y copywriter experto para redes sociales en español latinoamericano.

Tu trabajo es generar un mes COMPLETO de contenido para una marca, incluyendo:
- Estrategia mensual con objetivos y pilares
- Calendario de piezas distribuidas estratégicamente
- Copys completos listos para publicar
- Hashtags relevantes y optimizados
- Briefs visuales para el diseñador

REGLAS DE CALIDAD:
1. Cada hook debe ser IRRESISTIBLE - que detenga el scroll
2. Los copys deben sonar HUMANOS, no robóticos
3. Variar estilos: preguntas, declaraciones, estadísticas, historias
4. Respetar el tono de marca SIEMPRE
5. Hashtags: mezclar populares (>100k) con nicho (<10k)
6. Distribuir formatos y pilares equilibradamente en el mes

FORMATOS DE CONTENIDO:
- POST: Imagen única con copy educativo/inspiracional
- CAROUSEL: 5-7 slides con información step-by-step
- REEL: Video corto con script, hook fuerte
- STORY: Contenido efímero, más informal y directo

OUTPUT: Responde ÚNICAMENTE con JSON válido, sin texto adicional.`
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

        const response = await client.messages.create({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 16000,
            temperature: 0.7,
            system: systemPrompt,
            messages: [
                { role: 'user', content: userPrompt }
            ]
        })

        const textContent = response.content.find(c => c.type === 'text')
        if (!textContent || textContent.type !== 'text') {
            throw new Error('No text response from Claude')
        }

        // Parse JSON response
        let jsonText = textContent.text.trim()

        // Remove markdown code blocks if present
        if (jsonText.startsWith('```json')) {
            jsonText = jsonText.replace(/^```json\n?/, '').replace(/\n?```$/, '')
        } else if (jsonText.startsWith('```')) {
            jsonText = jsonText.replace(/^```\n?/, '').replace(/\n?```$/, '')
        }

        const result = JSON.parse(jsonText)

        const tokensUsed = response.usage.input_tokens + response.usage.output_tokens
        const duration = Date.now() - startTime

        console.log(`[ContentGenerator] Generated ${result.pieces.length} pieces in ${duration}ms using ${tokensUsed} tokens`)

        return {
            strategy: result.strategy,
            pieces: result.pieces,
            tokensUsed,
            duration
        }
    }
}

export const contentGenerator = new ContentGenerator()
