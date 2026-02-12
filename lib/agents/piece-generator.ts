// Single Piece Generator - Optimized for Vercel Hobby (< 10s per call)
// Generates ONE content piece at a time instead of a full month

import Anthropic from '@anthropic-ai/sdk'
import { getWorkspaceApiKeys } from '../workspace'
import type { BrandContext, MonthBrief, GeneratedPiece } from './content-generator'

const MONTH_NAMES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

export interface PieceRequest {
    brand: BrandContext
    brief: MonthBrief
    format: 'POST' | 'CAROUSEL' | 'REEL' | 'STORY'
    pillar: string
    dayOfMonth: number
    pieceNumber: number
    totalPieces: number
    model?: string
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

// Wrapper for backward compatibility (used by other API routes)
export async function generateSinglePiece(
    req: PieceRequest,
    workspaceId?: string
): Promise<GeneratedPiece> {
    const concept = await generatePieceConcept(req, workspaceId);
    return await generatePieceDetails(concept, req, workspaceId);
}

// 1. Generate Concept (Fast, < 5s)
export async function generatePieceConcept(
    req: PieceRequest,
    workspaceId?: string
): Promise<Partial<GeneratedPiece>> {
    const prompt = `Genera SOLO el concepto para una pieza de contenido.
    
MARCA: ${req.brand.name}
FORMATO: ${req.format}
PILAR: ${req.pillar}
OBJETIVO: ${req.brief.primaryObjective}

Responde JSON: { "topic": "Título atractivo", "pillar": "${req.pillar}", "format": "${req.format}", "dayOfMonth": ${req.dayOfMonth} }`;

    return await callClaude(prompt, workspaceId, 'claude-3-5-sonnet-20240620', 1000);
}

// 2. Generate Details (Copy + Visuals) - (< 8s)
export async function generatePieceDetails(
    concept: Partial<GeneratedPiece>,
    req: PieceRequest,
    workspaceId?: string
): Promise<GeneratedPiece> {
    const prompt = `Eres un copywriter experto. Desarrolla este concepto:
    
TÍTULO: "${concept.topic}"
FORMATO: ${concept.format}
MARCA: ${req.brand.name}
TONO: ${req.brand.primaryTone}

Genera el contenido completo en JSON:
{
  "dayOfMonth": ${concept.dayOfMonth},
  "format": "${concept.format}",
  "pillar": "${concept.pillar}",
  "topic": "${concept.topic}",
  "hooks": [{"text": "Hook 1", "style": "pregunta"}],
  "captionLong": "Copy completo...",
  "captionShort": "Copy corto...",
  "hashtags": ["#tag"],
  "visualBrief": "Descripción visual...",
  "ctas": ["CTA"],
  "carouselSlides": ${req.format === 'CAROUSEL' ? '[]' : 'null'}
}`;

    return await callClaude(prompt, workspaceId, 'claude-3-5-sonnet-20240620', 2000);
}

async function callClaude(prompt: string, workspaceId: string | undefined, model: string, maxTokens: number): Promise<any> {
    let apiKey = process.env.ANTHROPIC_API_KEY;
    if (workspaceId) {
        const keys = await getWorkspaceApiKeys(workspaceId);
        if (keys?.anthropic) apiKey = keys.anthropic;
    }

    if (!apiKey) throw new Error("No API Key");

    const client = new Anthropic({ apiKey });

    try {
        const response = await client.messages.create({
            model,
            max_tokens: maxTokens,
            temperature: 0.7,
            messages: [{ role: 'user', content: prompt }]
        });

        const text = (response.content[0] as any).text;
        return extractJson(text);
    } catch (e) {
        console.error("Claude Error", e);
        throw e;
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

    const prompt = `Eres un estratega de contenido.
MARCA: ${brand.name}
MES: ${monthName}
OBJETIVO: ${brief.primaryObjective}
PIEZAS: ${totalPieces} (${plan.posts} posts, ${plan.carousels} carruseles, ${plan.reels} reels, ${plan.stories} stories)

Genera SOLO la distribución de piezas en JSON. No inventes fechas ni pilares complejos, usa genéricos si es necesario.

JSON Requerido:
{
  "monthlyObjective": "Objetivo corto",
  "pillars": [{"name": "Pilar 1", "description": "...", "percentage": 33}, {"name": "Pilar 2", "description": "...", "percentage": 33}, {"name": "Pilar 3", "description": "...", "percentage": 33}],
  "pieceAssignments": [
    {"dayOfMonth": 1, "format": "POST", "pillar": "Pilar 1"}
  ]
}
Asegura EXACTAMENTE ${totalPieces} items en pieceAssignments.`;

    try {
        const response = await client.messages.create({
            model: 'claude-3-haiku-20240307',
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
