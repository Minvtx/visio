// Single Piece Generator - Optimized for Vercel Hobby (< 10s per call)
// Generates ONE content piece at a time instead of a full month

import Anthropic from '@anthropic-ai/sdk'
import { getWorkspaceApiKeys } from '../workspace'
import type { BrandContext, MonthBrief, GeneratedPiece } from './content-generator'

const MONTH_NAMES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

interface PieceRequest {
    brand: BrandContext
    brief: MonthBrief
    format: 'POST' | 'CAROUSEL' | 'REEL' | 'STORY'
    pillar: string
    dayOfMonth: number
    pieceNumber: number
    totalPieces: number
}

/**
 * Robust JSON extraction from AI responses. 
 * Finds the first `{` and last `}` and tries to parse what's in between.
 */
function extractJson(text: string): any {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
        throw new Error("No se encontró un JSON válido en la respuesta de la IA.");
    }

    let cleaned = jsonMatch[0];

    // Sometimes AI includes markdown markers inside the match if it's messy
    cleaned = cleaned.replace(/^```json/, '').replace(/```$/, '').trim();

    try {
        return JSON.parse(cleaned);
    } catch (e) {
        console.error("[JSON Extract Error] Failed to parse cleaned text:", cleaned);
        throw e;
    }
}

export async function generateSinglePiece(
    req: PieceRequest,
    workspaceId?: string
): Promise<GeneratedPiece> {
    let apiKey = process.env.ANTHROPIC_API_KEY

    // Log key presence for debugging
    console.log('[DEBUG] Generating piece. Env Key present:', !!apiKey)

    if (workspaceId) {
        try {
            const keys = await getWorkspaceApiKeys(workspaceId)
            if (keys?.anthropic) {
                apiKey = keys.anthropic
                const mask = apiKey.substring(0, 5) + '...' + apiKey.substring(apiKey.length - 4)
                console.log(`[DEBUG] Using workspace key: ${mask}`)
            } else {
                console.log('[DEBUG] Workspace exists but has no custom Anthropic key.')
            }
        } catch (e) {
            console.error('[ERROR] Failed to fetch workspace keys:', e)
        }
    }

    if (!apiKey || apiKey.trim() === '') {
        console.error('[CRITICAL] No API Key found for Anthropic')
        throw new Error('No hay API Key de Anthropic configurada. Por favor, configúrala en el Workspace o en las variables de entorno.')
    }

    const client = new Anthropic({ apiKey })

    const monthName = MONTH_NAMES[req.brief.month - 1]

    const products = Array.isArray(req.brand.products)
        ? req.brand.products.filter(p => p && (p.name || p.description)).map(p => p.name).join(', ')
        : 'Información general'

    const audiences = Array.isArray(req.brand.targetAudiences)
        ? req.brand.targetAudiences.filter(a => a && (a.name || a.description)).map(a => `${a.name}: ${a.description}`).join('; ')
        : 'Público general'

    const prompt = `Eres un copywriter experto para redes sociales en español latinoamericano.

MARCA: ${req.brand.name || 'La Marca'}
INDUSTRIA: ${req.brand.industry || 'General'}
SOBRE: ${req.brand.about || 'Descripción no disponible'}
TONO: ${req.brand.primaryTone || 'Profesional'}
HABLA COMO: ${req.brand.speakingAs || 'nosotros'}
EMOJIS: ${req.brand.emojiUsage || 'moderado'}
PERSONALIDAD: ${Array.isArray(req.brand.brandPersonality) ? req.brand.brandPersonality.join(', ') : 'Profesional'}
PRODUCTOS: ${products}
AUDIENCIA: ${audiences}

MES: ${monthName} ${req.brief.year}
OBJETIVO: ${req.brief.primaryObjective || 'Engagement'}
PIEZA ${req.pieceNumber}/${req.totalPieces}

Genera UNA pieza de contenido tipo ${req.format} sobre el pilar "${req.pillar}" para el día ${req.dayOfMonth}.

${req.format === 'CAROUSEL' ? 'Incluye carouselSlides con 5-7 slides.' : 'carouselSlides debe ser null.'}

Responde SOLO con este JSON exacto:
{
  "dayOfMonth": ${req.dayOfMonth},
  "format": "${req.format}",
  "pillar": "${req.pillar}",
  "topic": "tema creativo y relevante",
  "hooks": [
    {"text": "Hook irresistible que detenga el scroll", "style": "pregunta"},
    {"text": "Hook alternativo", "style": "declaración"}
  ],
  "captionLong": "Copy de 100-200 palabras listo para publicar con emojis y CTA",
  "captionShort": "Versión corta en 2-3 líneas",
  "hashtags": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5"],
  "visualBrief": "Descripción clara de la imagen/video para el diseñador",
  "ctas": ["CTA principal", "CTA alternativo"],
  "carouselSlides": null
}

${req.brand.requiredHashtags?.length ? 'INCLUIR estos hashtags: ' + req.brand.requiredHashtags.join(' ') : ''}
${req.brand.forbiddenWords?.length ? 'NO usar estas palabras: ' + req.brand.forbiddenWords.join(', ') : ''}
${req.brand.guardrails?.length ? 'REGLAS: ' + req.brand.guardrails.join('. ') : ''}

Solo JSON, sin texto adicional.`

    try {
        const response = await client.messages.create({
            model: 'claude-3-5-sonnet-latest',
            max_tokens: 3000,
            temperature: 0.7,
            messages: [{ role: 'user', content: prompt }]
        })

        const textContent = response.content.find(c => c.type === 'text')
        if (!textContent || textContent.type !== 'text') {
            throw new Error('No text response from Claude')
        }

        const rawText = (textContent as any).text.trim()

        try {
            return extractJson(rawText) as GeneratedPiece
        } catch (parseError: any) {
            console.error('[GENERATE PIECE PARSE ERROR] Raw text:', rawText.substring(0, 500))
            throw new Error(`La IA no devolvió un formato válido: ${parseError.message}`)
        }

    } catch (e: any) {
        if (e.status === 401) throw new Error('API Key de Anthropic inválida o expirada.')
        if (e.status === 404) throw new Error('Modelo de IA no disponible para esta API Key.')
        if (e.status === 429) throw new Error('Límite de cuota de Anthropic excedido.')
        if (e.status === 529) throw new Error('Anthropic está sobrecargado. Intenta en unos minutos.')

        console.error('[ANTHROPIC ERROR]', e)
        throw e
    }
}

// Generate just the strategy (lightweight, < 5 seconds)
export async function generateStrategy(
    brand: BrandContext,
    brief: MonthBrief,
    plan: { posts: number; carousels: number; reels: number; stories: number },
    workspaceId?: string
) {
    let apiKey = process.env.ANTHROPIC_API_KEY
    if (workspaceId) {
        try {
            const keys = await getWorkspaceApiKeys(workspaceId)
            if (keys?.anthropic) {
                apiKey = keys.anthropic
                const mask = apiKey.substring(0, 5) + '...' + apiKey.substring(apiKey.length - 4)
                console.log(`[DEBUG] Strategy: Using workspace key: ${mask}`)
            }
        } catch (e) {
            console.error('[ERROR] Failed to fetch workspace keys for strategy:', e)
        }
    }

    if (!apiKey || apiKey.trim() === '') {
        console.error('[CRITICAL] No API Key found for Anthropic (Strategy)')
        throw new Error('No hay API Key de Anthropic configurada. Por favor, configúrala en el Workspace.')
    }

    const client = new Anthropic({ apiKey })
    const monthName = MONTH_NAMES[brief.month - 1]
    const totalPieces = plan.posts + plan.carousels + plan.reels + plan.stories

    const prompt = `Eres un estratega de contenido para redes sociales en español.

MARCA: ${brand.name || 'La Marca'} | INDUSTRIA: ${brand.industry || 'General'}
SOBRE: ${brand.about || 'Descripción no disponible'}
MES: ${monthName} ${brief.year}
OBJETIVO: ${brief.primaryObjective || 'Aumentar engagement'}
TOTAL PIEZAS: ${totalPieces} (${plan.posts} posts, ${plan.carousels} carruseles, ${plan.reels} reels, ${plan.stories} stories)

Genera SOLO la estrategia mensual en este JSON exacto:
{
  "monthlyObjective": "Objetivo claro y medible",
  "pillars": [
    {"name": "Pilar 1", "description": "Descripción", "percentage": 40},
    {"name": "Pilar 2", "description": "Descripción", "percentage": 30},
    {"name": "Pilar 3", "description": "Descripción", "percentage": 30}
  ],
  "keyDates": [
    {"date": "DD/MM", "event": "Evento", "contentIdea": "Idea"}
  ],
  "pieceAssignments": [
    {"dayOfMonth": 1, "format": "POST", "pillar": "Pilar 1"},
    {"dayOfMonth": 3, "format": "CAROUSEL", "pillar": "Pilar 2"}
  ]
}

En pieceAssignments incluye EXACTAMENTE ${totalPieces} items distribuidos en el mes.
Solo JSON, sin texto adicional.`

    try {
        const response = await client.messages.create({
            model: 'claude-3-5-sonnet-latest',
            max_tokens: 3000,
            temperature: 0.7,
            messages: [{ role: 'user', content: prompt }]
        })

        const textContent = response.content.find(c => c.type === 'text')
        if (!textContent || textContent.type !== 'text') throw new Error('No response content from Claude')

        const rawText = (textContent as any).text.trim()

        try {
            return extractJson(rawText)
        } catch (parseError: any) {
            console.error('[GENERATE STRATEGY PARSE ERROR] Raw text:', rawText.substring(0, 500))
            throw parseError
        }
    } catch (e: any) {
        console.error('[STRATEGY ERROR] Failed to generate strategy:', e)
        // Fallback Strategy so process doesn't die
        return {
            monthlyObjective: brief.primaryObjective || "Aumentar visibilidad y engagement",
            pillars: [
                { name: "Educación", description: "Contenido de valor", percentage: 40 },
                { name: "Entretenimiento", description: "Humor y tendencias", percentage: 30 },
                { name: "Venta", description: "Promoción de servicios", percentage: 30 }
            ],
            keyDates: [],
            pieceAssignments: Array.from({ length: totalPieces }).map((_, i) => ({
                dayOfMonth: Math.min(28, (i * 2) + 1),
                format: i % 4 === 0 ? 'REEL' : i % 3 === 0 ? 'CAROUSEL' : 'POST',
                pillar: i % 2 === 0 ? 'Educación' : 'Entretenimiento'
            }))
        }
    }
}
