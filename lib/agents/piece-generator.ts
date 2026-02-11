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
                console.log('[DEBUG] Using workspace specific key')
            }
        } catch (e) {
            console.error('[ERROR] Failed to fetch workspace keys:', e)
        }
    }

    if (!apiKey) {
        console.error('[CRITICAL] No API Key found for Anthropic')
        throw new Error('No hay API Key de Anthropic configurada. Verificá las variables de entorno.')
    }

    const client = new Anthropic({ apiKey })

    const monthName = MONTH_NAMES[req.brief.month - 1]

    const prompt = `Eres un copywriter experto para redes sociales en español latinoamericano.

MARCA: ${req.brand.name}
INDUSTRIA: ${req.brand.industry}
SOBRE: ${req.brand.about}
TONO: ${req.brand.primaryTone}
HABLA COMO: ${req.brand.speakingAs || 'nosotros'}
EMOJIS: ${req.brand.emojiUsage || 'moderado'}
PERSONALIDAD: ${req.brand.brandPersonality?.join(', ') || 'Profesional'}
${req.brand.products?.length ? 'PRODUCTOS: ' + req.brand.products.map(p => p.name).join(', ') : ''}
${req.brand.targetAudiences?.length ? 'AUDIENCIA: ' + req.brand.targetAudiences.map(a => a.name + ': ' + a.description).join('; ') : ''}

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

        let jsonText = (textContent as any).text.trim()

        // Log raw for debug
        // console.log('[DEBUG] Raw AI Response:', jsonText.substring(0, 100) + '...')

        // Cleanup markdown
        if (jsonText.startsWith('```json')) {
            jsonText = jsonText.replace(/^```json\n?/, '').replace(/\n?```$/, '')
        } else if (jsonText.startsWith('```')) {
            jsonText = jsonText.replace(/^```\n?/, '').replace(/\n?```$/, '')
        }

        try {
            return JSON.parse(jsonText.trim()) as GeneratedPiece
        } catch (parseError) {
            console.error('[JSON PARSE ERROR] Raw text:', jsonText)
            throw new Error('La IA no devolvió un JSON válido. Revisa los logs.')
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

    // Log key presence for debugging
    console.log('[DEBUG] Generating strategy. Env Key present:', !!apiKey)

    if (workspaceId) {
        try {
            const keys = await getWorkspaceApiKeys(workspaceId)
            if (keys?.anthropic) {
                apiKey = keys.anthropic
                console.log('[DEBUG] Using workspace specific key for strategy')
            }
        } catch (e) {
            console.error('[ERROR] Failed to fetch workspace keys for strategy:', e)
        }
    }

    if (!apiKey) {
        console.error('[CRITICAL] No API Key found for Anthropic (Strategy)')
        throw new Error('No hay API Key de Anthropic configurada. Verificá las variables de entorno.')
    }

    const client = new Anthropic({ apiKey })
    const monthName = MONTH_NAMES[brief.month - 1]
    const totalPieces = plan.posts + plan.carousels + plan.reels + plan.stories

    const prompt = `Eres un estratega de contenido para redes sociales en español.

MARCA: ${brand.name} | INDUSTRIA: ${brand.industry}
SOBRE: ${brand.about}
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

        let jsonText = (textContent as any).text.trim()
        if (jsonText.startsWith('```json')) jsonText = jsonText.replace(/^```json\n?/, '').replace(/\n?```$/, '')
        else if (jsonText.startsWith('```')) jsonText = jsonText.replace(/^```\n?/, '').replace(/\n?```$/, '')

        return JSON.parse(jsonText)
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
