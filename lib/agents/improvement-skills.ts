// Improvement Skills - Used only for post-generation refinement
// These are called on-demand when the user wants to improve specific pieces

import Anthropic from '@anthropic-ai/sdk'
import { getWorkspaceApiKeys } from '../workspace'

interface SkillResult<T> {
    success: boolean
    output: T | null
    tokensUsed: number
    error?: string
}

async function getClient(workspaceId?: string): Promise<Anthropic> {
    let apiKey = process.env.ANTHROPIC_API_KEY

    if (workspaceId) {
        const keys = await getWorkspaceApiKeys(workspaceId)
        if (keys.anthropic) {
            apiKey = keys.anthropic
        }
    }

    if (!apiKey) {
        throw new Error('No hay API Key configurada')
    }

    return new Anthropic({ apiKey })
}

// ═══════════════════════════════════════════════════════════════
// HUMANIZER - Makes content sound more natural and less AI-like
// ═══════════════════════════════════════════════════════════════

export interface HumanizeInput {
    content: string
    tone: string
    audience?: string
}

export interface HumanizeOutput {
    humanizedContent: string
    changes: string[]
}

export async function humanize(
    input: HumanizeInput,
    workspaceId?: string
): Promise<SkillResult<HumanizeOutput>> {
    try {
        const client = await getClient(workspaceId)

        const response = await client.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 2000,
            temperature: 0.6,
            system: `Eres un experto en hacer que el contenido suene natural y humano.

Tu trabajo es tomar un copy que puede sonar "robótico" o "generado por IA" y hacerlo sonar como si lo hubiera escrito una persona real.

TÉCNICAS:
- Agregar imperfecciones naturales (expresiones coloquiales, modismos)
- Variar la longitud de las oraciones
- Usar contracciones y lenguaje conversacional
- Agregar personalidad y emoción genuina
- Mantener el mensaje pero hacerlo más cálido

IMPORTANTE: Mantén el tono de marca indicado.

Responde en JSON: { "humanizedContent": "...", "changes": ["cambio 1", "cambio 2"] }`,
            messages: [
                {
                    role: 'user',
                    content: `TONO DE MARCA: ${input.tone}
${input.audience ? `AUDIENCIA: ${input.audience}` : ''}

CONTENIDO ORIGINAL:
${input.content}

Humaniza este contenido manteniendo el mensaje pero haciéndolo sonar más natural.`
                }
            ]
        })

        const textContent = response.content.find(c => c.type === 'text')
        if (!textContent || textContent.type !== 'text') {
            throw new Error('No response')
        }

        let jsonText = textContent.text.trim()
        if (jsonText.startsWith('```')) {
            jsonText = jsonText.replace(/^```json?\n?/, '').replace(/\n?```$/, '')
        }

        const output = JSON.parse(jsonText)

        return {
            success: true,
            output,
            tokensUsed: response.usage.input_tokens + response.usage.output_tokens
        }
    } catch (error) {
        return {
            success: false,
            output: null,
            tokensUsed: 0,
            error: error instanceof Error ? error.message : 'Unknown error'
        }
    }
}

// ═══════════════════════════════════════════════════════════════
// BRAND CHECK - Validates content against brand guidelines
// ═══════════════════════════════════════════════════════════════

export interface BrandCheckInput {
    content: string
    brandTone: string
    guardrails?: string[]
    forbiddenWords?: string[]
    requiredHashtags?: string[]
}

export interface BrandCheckOutput {
    isCompliant: boolean
    score: number // 0-100
    issues: Array<{
        type: 'tone' | 'guardrail' | 'forbidden_word' | 'hashtag'
        description: string
        severity: 'low' | 'medium' | 'high'
    }>
    suggestions: string[]
}

export async function brandCheck(
    input: BrandCheckInput,
    workspaceId?: string
): Promise<SkillResult<BrandCheckOutput>> {
    try {
        const client = await getClient(workspaceId)

        const response = await client.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1500,
            temperature: 0.3,
            system: `Eres un QA de contenido que valida si un copy cumple con los lineamientos de marca.

Analiza el contenido y verifica:
1. ¿Respeta el tono de voz indicado?
2. ¿Viola algún guardrail (tema prohibido)?
3. ¿Usa palabras prohibidas?
4. ¿Incluye los hashtags requeridos?

Sé exigente pero justo. Un contenido puede no ser perfecto pero ser aceptable.

Responde en JSON:
{
  "isCompliant": true/false,
  "score": 0-100,
  "issues": [{ "type": "...", "description": "...", "severity": "low/medium/high" }],
  "suggestions": ["sugerencia 1", "sugerencia 2"]
}`,
            messages: [
                {
                    role: 'user',
                    content: `TONO DE MARCA: ${input.brandTone}
GUARDRAILS: ${input.guardrails?.join(', ') || 'Ninguno'}
PALABRAS PROHIBIDAS: ${input.forbiddenWords?.join(', ') || 'Ninguna'}
HASHTAGS REQUERIDOS: ${input.requiredHashtags?.join(' ') || 'Ninguno'}

CONTENIDO A VALIDAR:
${input.content}`
                }
            ]
        })

        const textContent = response.content.find(c => c.type === 'text')
        if (!textContent || textContent.type !== 'text') {
            throw new Error('No response')
        }

        let jsonText = textContent.text.trim()
        if (jsonText.startsWith('```')) {
            jsonText = jsonText.replace(/^```json?\n?/, '').replace(/\n?```$/, '')
        }

        const output = JSON.parse(jsonText)

        return {
            success: true,
            output,
            tokensUsed: response.usage.input_tokens + response.usage.output_tokens
        }
    } catch (error) {
        return {
            success: false,
            output: null,
            tokensUsed: 0,
            error: error instanceof Error ? error.message : 'Unknown error'
        }
    }
}

// ═══════════════════════════════════════════════════════════════
// REGENERATE PIECE - Regenerates a single piece of content
// ═══════════════════════════════════════════════════════════════

export interface RegeneratePieceInput {
    brandName: string
    brandTone: string
    industry: string
    format: 'POST' | 'CAROUSEL' | 'REEL' | 'STORY'
    pillar: string
    originalTopic: string
    feedback?: string // What the user didn't like
    emojiUsage?: string
}

export interface RegeneratedPiece {
    topic: string
    hooks: Array<{ text: string; style: string }>
    captionLong: string
    captionShort: string
    hashtags: string[]
    visualBrief: string
    ctas: string[]
    carouselSlides?: Array<{ slideNumber: number; content: string }>
}

export async function regeneratePiece(
    input: RegeneratePieceInput,
    workspaceId?: string
): Promise<SkillResult<RegeneratedPiece>> {
    try {
        const client = await getClient(workspaceId)

        const response = await client.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 3000,
            temperature: 0.8, // Higher for variety
            system: `Eres un copywriter experto generando contenido fresco y único.

Se te pide regenerar una pieza de contenido porque el usuario no está satisfecho con la versión actual.

GENERA ALGO COMPLETAMENTE DIFERENTE al tema original.
Si hay feedback del usuario, úsalo para guiar tu creatividad.

El contenido debe ser:
- Fresco y original
- Alineado con el tono de marca
- Optimizado para el formato indicado
- Listo para publicar

Responde en JSON con la estructura indicada.`,
            messages: [
                {
                    role: 'user',
                    content: `MARCA: ${input.brandName}
INDUSTRIA: ${input.industry}
TONO: ${input.brandTone}
FORMATO: ${input.format}
PILAR: ${input.pillar}
EMOJIS: ${input.emojiUsage || 'moderado'}

TEMA ORIGINAL (generar algo DIFERENTE): ${input.originalTopic}
${input.feedback ? `FEEDBACK DEL USUARIO: ${input.feedback}` : ''}

Genera una pieza nueva y diferente en JSON:
{
  "topic": "Nuevo tema diferente",
  "hooks": [{ "text": "...", "style": "pregunta/estadística/declaración" }],
  "captionLong": "Copy completo de 150-250 palabras",
  "captionShort": "Versión corta en 2-3 líneas",
  "hashtags": ["#hashtag1", ... (10 total)],
  "visualBrief": "Descripción de la imagen/video",
  "ctas": ["CTA 1", "CTA 2"],
  "carouselSlides": ${input.format === 'CAROUSEL' ? '[{ "slideNumber": 1, "content": "..." }, ...]' : 'null'}
}`
                }
            ]
        })

        const textContent = response.content.find(c => c.type === 'text')
        if (!textContent || textContent.type !== 'text') {
            throw new Error('No response')
        }

        let jsonText = textContent.text.trim()
        if (jsonText.startsWith('```')) {
            jsonText = jsonText.replace(/^```json?\n?/, '').replace(/\n?```$/, '')
        }

        const output = JSON.parse(jsonText)

        return {
            success: true,
            output,
            tokensUsed: response.usage.input_tokens + response.usage.output_tokens
        }
    } catch (error) {
        return {
            success: false,
            output: null,
            tokensUsed: 0,
            error: error instanceof Error ? error.message : 'Unknown error'
        }
    }
}

// ═══════════════════════════════════════════════════════════════
// IMPROVE COPY - Quick improvements to existing copy
// ═══════════════════════════════════════════════════════════════

export interface ImproveCopyInput {
    content: string
    improvement: 'shorter' | 'longer' | 'punchier' | 'professional' | 'casual' | 'emotional'
    tone: string
}

export interface ImproveCopyOutput {
    improvedContent: string
    whatChanged: string
}

export async function improveCopy(
    input: ImproveCopyInput,
    workspaceId?: string
): Promise<SkillResult<ImproveCopyOutput>> {
    try {
        const client = await getClient(workspaceId)

        const improvements: Record<string, string> = {
            shorter: 'Hazlo más corto y directo, sin perder el mensaje',
            longer: 'Expándelo con más detalles y contexto',
            punchier: 'Hazlo más impactante y memorable, con frases cortas',
            professional: 'Hazlo más formal y profesional',
            casual: 'Hazlo más relajado y conversacional',
            emotional: 'Agrega más emoción y conexión humana'
        }

        const response = await client.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 2000,
            temperature: 0.6,
            system: `Eres un editor de copy experto. Tu trabajo es mejorar contenido existente según instrucciones específicas.

Mantén el mensaje central pero aplica la mejora solicitada.
Respeta el tono de marca.

Responde en JSON: { "improvedContent": "...", "whatChanged": "Descripción breve del cambio" }`,
            messages: [
                {
                    role: 'user',
                    content: `TONO DE MARCA: ${input.tone}
MEJORA SOLICITADA: ${improvements[input.improvement]}

CONTENIDO ORIGINAL:
${input.content}

Aplica la mejora y responde en JSON.`
                }
            ]
        })

        const textContent = response.content.find(c => c.type === 'text')
        if (!textContent || textContent.type !== 'text') {
            throw new Error('No response')
        }

        let jsonText = textContent.text.trim()
        if (jsonText.startsWith('```')) {
            jsonText = jsonText.replace(/^```json?\n?/, '').replace(/\n?```$/, '')
        }

        const output = JSON.parse(jsonText)

        return {
            success: true,
            output,
            tokensUsed: response.usage.input_tokens + response.usage.output_tokens
        }
    } catch (error) {
        return {
            success: false,
            output: null,
            tokensUsed: 0,
            error: error instanceof Error ? error.message : 'Unknown error'
        }
    }
}
