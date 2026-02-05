// Content Wizard Agent - Expert in Social Media Content Generation
// Specializes in Instagram algorithm, trends, and engagement tactics

import Anthropic from '@anthropic-ai/sdk'

// Types for Content Wizard
export interface BrandContext {
    name: string
    industry: string
    // Identity
    brandPersonality?: string[]
    brandArchetype?: string
    tagline?: string
    missionStatement?: string
    valueProposition?: string

    // Voice & Tone
    primaryTone: string
    secondaryTone?: string
    communicationStyle?: string
    speakingAs?: string // "nosotros", "yo", "la marca"
    emojiUsage?: string
    voiceDescription?: string

    // Knowledge Base
    about: string
    history?: string
    products?: any[] // Enhanced product objects
    targetAudiences?: any[] // Enhanced audience objects
    competitors?: string[]
    testimonials?: string[]

    // Guardrails
    guardrails?: string[]
    forbiddenWords?: string[]
    forbiddenTopics?: string[]
    requiredMentions?: string[]

    // Hashtags
    requiredHashtags?: string[]
    forbiddenHashtags?: string[]
}

export interface ContentPlan {
    posts: number
    carousels: number
    reels: number
    stories: number
}

export interface MonthlyStrategyBrief {
    primaryObjective?: string
    specificGoal?: string
    kpis?: string[]
    seasonality?: string
    relevantDates?: any[]
    industryTrends?: string[]
    activeCampaigns?: any[]
    contentPillars?: any[]
}

export interface GeneratedPiece {
    dayOfMonth: number
    format: 'POST' | 'CAROUSEL' | 'REEL' | 'STORY'
    pillar: string
    topic: string
    objective: 'AWARENESS' | 'ENGAGEMENT' | 'CONVERSION' | 'COMMUNITY'
    strategicJustification?: string // Why this piece?
    targetAudience?: string // Which segment?
    hooks: Array<{ text: string; style: string }>
    captionLong: string
    captionShort: string
    ctas: string[]
    hashtags: string[]
    suggestedTime: string
    visualConcept: string
    carouselSlides?: Array<{ slideNumber: number; content: string; purpose: string }>
}

export interface ContentWizardOutput {
    strategy: {
        monthlyObjective: string
        pillars: Array<{ name: string; description: string; percentage: number }>
        keyDates: string[]
        audienceInsights: string[]
    }
    pieces: GeneratedPiece[]
    metrics: {
        totalPieces: number
        formatDistribution: Record<string, number>
        tokensUsed: number
    }
}

// Instagram expertise knowledge base
const INSTAGRAM_EXPERTISE = `
## 🎯 EXPERTISE: ALGORITMO INSTAGRAM 2026

### PRIORIDADES DEL ALGORITMO
1. **Reels**: Mayor alcance orgánico (3-5x más que posts estáticos)
2. **Carruseles**: Alto engagement, más tiempo en pantalla
3. **Posts estáticos**: Menor alcance pero buenos para SEO de perfil
4. **Stories**: Engagement directo, fidelización

### SEÑALES QUE PREMIA EL ALGORITMO
- **Saves** (la métrica más valiosa) - Contenido que la gente quiere guardar
- **Shares** (compartidos en DM o Stories) - Contenido viral
- **Tiempo de visualización** - Especialmente en Reels
- **Comentarios largos** - Indican engagement real
- **Interacción rápida** - Primeros 30-60 minutos cruciales

### TENDENCIAS 2026
- **Edutainment**: Educar + Entretener
- **Behind the scenes**: Autenticidad sobre perfección
- **Carruseles de valor**: 5-7 slides con tips accionables
- **Reels cortos**: 15-30 segundos máximo engagement
- **Hooks en 0.5 segundos**: Primera línea/frame crucial
- **Storytelling personal**: Conectar emocionalmente
- **UGC style**: Contenido que parece orgánico, no publicitario
`

const SYSTEM_PROMPT = `Eres el Content Wizard, un experto de clase mundial en estrategia de contenido para redes sociales, especializado en Instagram.

${INSTAGRAM_EXPERTISE}

## TU MISIÓN
Generar un mes completo de contenido estratégico, on-brand y optimizado para Instagram, maximizando engagement y alcance.
Debes actuar como un estratega senior que conoce profundamente a la marca y a su audiencia.

## REGLAS INQUEBRANTABLES
1. **PERSONALIDAD EXTREMA**: Usa el tono, arquetipo y estilo de comunicación de la marca en CADA palabra. Si la marca es "disruptiva", no escribas como "corporativa".
2. **ESTRATEGIA PRIMERO**: Cada pieza debe tener una justificación estratégica (por qué este tema, por qué hoy, para qué audiencia).
3. **HOOKS IRRESISTIBLES**: El hook es el 80% del éxito. Deben detener el scroll instantáneamente.
4. **VALOR REAL**: Nada de contenido de relleno ("Feliz lunes"). Cada pieza debe educar, entretener o inspirar.
5. **MOBILE-FIRST**: Estructura los captions con espacios, emojis estratégicos y frases cortas.
6. **GUARDRAILS ESTRICTOS**: NUNCA uses palabras prohibidas ni menciones temas prohibidos. SIEMPRE incluye menciones obligatorias si las hay.
7. **VARIEDAD**: Mezcla formatos y ángulos. No repitas la misma estructura de hook dos veces seguidas.

## FORMATO DE RESPUESTA
Responde ÚNICAMENTE con JSON válido siguiendo exactamente esta estructura:
{
  "strategy": {
    "monthlyObjective": "string",
    "pillars": [{"name": "string", "description": "string", "percentage": number}],
    "keyDates": ["string"],
    "audienceInsights": ["string"]
  },
  "pieces": [
    {
      "dayOfMonth": number,
      "format": "POST" | "CAROUSEL" | "REEL" | "STORY",
      "pillar": "string",
      "topic": "string",
      "objective": "AWARENESS" | "ENGAGEMENT" | "CONVERSION" | "COMMUNITY",
      "strategicJustification": "string (breve explicación de por qué esta pieza)",
      "targetAudience": "string (a quién le habla)",
      "hooks": [{"text": "string", "style": "question|statement|statistic|story|curiosity|benefit"}],
      "captionLong": "string (150-250 palabras, on-brand, estructurado)",
      "captionShort": "string (máximo 50 palabras para Stories/Reels)",
      "ctas": ["string", "string", "string"],
      "hashtags": ["string (sin #, solo la palabra)"],
      "suggestedTime": "HH:MM",
      "visualConcept": "string (instrucciones muy detalladas para el diseñador)",
      "carouselSlides": [{"slideNumber": number, "content": "string", "purpose": "string"}] // solo si format es CAROUSEL
    }
  ]
}`

class ContentWizardAgent {
    private anthropic: Anthropic

    constructor() {
        this.anthropic = new Anthropic({
            apiKey: process.env.ANTHROPIC_API_KEY,
        })
    }

    async generateMonth(
        brand: BrandContext,
        month: number,
        year: number,
        plan: ContentPlan,
        strategyBrief?: MonthlyStrategyBrief
    ): Promise<ContentWizardOutput> {
        const monthNames = [
            '', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ]

        const totalPieces = plan.posts + plan.carousels + plan.reels + plan.stories

        const userPrompt = `
## 1. IDENTIDAD DE MARCA (CRUCIAL)
- **Nombre**: ${brand.name}
- **Industria**: ${brand.industry}
- **Personalidad**: ${brand.brandPersonality?.join(', ') || 'No definida'}
- **Arquetipo**: ${brand.brandArchetype || 'No definido'}
- **Propuesta de Valor**: ${brand.valueProposition || 'No definida'}

## 2. VOZ Y COMUNICACIÓN
- **Tono Principal**: ${brand.primaryTone}
- **Tono Secundario**: ${brand.secondaryTone || 'N/A'}
- **Estilo**: ${brand.communicationStyle || 'N/A'}
- **Hablando como**: ${brand.speakingAs || 'Nosotros'}
- **Uso de Emojis**: ${brand.emojiUsage || 'Moderado'}
- **Descripción de Voz**: ${brand.voiceDescription || ''}

## 3. GUARDRAILS (REQUSITOS ESTRICTOS)
- **Palabras Prohibidas**: ${brand.forbiddenWords?.join(', ') || 'Ninguna'}
- **Temas Prohibidos**: ${brand.forbiddenTopics?.join(', ') || 'Ninguno'}
- **Menciones Obligatorias**: ${brand.requiredMentions?.join(', ') || 'Ninguna'}
- **Competidores (NO MENCIONAR)**: ${brand.competitors?.join(', ') || 'Ninguno'}

## 4. CONOCIMIENTO (KNOWLEDGE BASE)
- **Sobre la marca**: ${brand.about}
- **Productos/Servicios**: ${JSON.stringify(brand.products || [])}
- **Audiencias Objetivo**: ${JSON.stringify(brand.targetAudiences || [])}
- **Testimonios/Social Proof**: ${brand.testimonials?.join('; ') || ''}

## 5. ESTRATEGIA DEL MES: ${monthNames[month]} ${year}
${strategyBrief ? `
- **Objetivo Principal**: ${strategyBrief.primaryObjective}
- **Meta Específica**: ${strategyBrief.specificGoal}
- **Campañas Activas**: ${JSON.stringify(strategyBrief.activeCampaigns || [])}
- **Fechas Importantes**: ${JSON.stringify(strategyBrief.relevantDates || [])}
- **Pilares Prioritarios**: ${JSON.stringify(strategyBrief.contentPillars || [])}
` : '- Define la mejor estrategia basada en la marca.'}

## 6. REQUERIMIENTOS DEL PLAN
- **Total de piezas**: ${totalPieces}
- Posts estáticos: ${plan.posts}
- Carruseles: ${plan.carousels}
- Reels: ${plan.reels}
- Stories: ${plan.stories}

## INSTRUCCIONES DE EJECUCIÓN
1. Analiza profundamente la personalidad y tono de voz. Todo el copy debe sonar como ellos.
2. Si hay **Campañas Activas**, asegúrate de que al menos el 40% del contenido se enfoque en ellas.
3. Usa la información de **Productos** y **Audiencias** para crear contenido de dolor/beneficio específico.
4. Distribuye el contenido lógicamente durante el mes.
5. Para los **Carruseles**, crea una estructura narrativa lógica (Slide 1: Hook -> Slide 2-N: Valor -> Slide Final: CTA).

Genera el contenido ahora.
`

        try {
            const response = await this.anthropic.messages.create({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 16000,
                temperature: 0.7,
                system: SYSTEM_PROMPT,
                messages: [
                    { role: 'user', content: userPrompt }
                ],
            })

            const textContent = response.content.find(c => c.type === 'text')
            if (!textContent || textContent.type !== 'text') {
                throw new Error('No text response from Content Wizard')
            }

            // Extract JSON from response
            const jsonMatch = textContent.text.match(/\{[\s\S]*\}/)
            if (!jsonMatch) {
                throw new Error('No valid JSON in Content Wizard response')
            }

            const output = JSON.parse(jsonMatch[0])
            const tokensUsed = response.usage.input_tokens + response.usage.output_tokens

            return {
                strategy: output.strategy,
                pieces: output.pieces,
                metrics: {
                    totalPieces: output.pieces.length,
                    formatDistribution: {
                        POST: output.pieces.filter((p: GeneratedPiece) => p.format === 'POST').length,
                        CAROUSEL: output.pieces.filter((p: GeneratedPiece) => p.format === 'CAROUSEL').length,
                        REEL: output.pieces.filter((p: GeneratedPiece) => p.format === 'REEL').length,
                        STORY: output.pieces.filter((p: GeneratedPiece) => p.format === 'STORY').length,
                    },
                    tokensUsed,
                },
            }
        } catch (error) {
            console.error('Content Wizard Error:', error)
            throw error
        }
    }

    // Regenerate a single piece
    async regeneratePiece(
        brand: BrandContext,
        existingPiece: GeneratedPiece,
        feedback?: string
    ): Promise<GeneratedPiece> {
        const userPrompt = `
## CONTEXTO DE MARCA
- Nombre: ${brand.name}
- Tono: ${brand.primaryTone}
- Personalidad: ${brand.brandPersonality?.join(', ') || ''}

## PIEZA A REGENERAR
- Formato: ${existingPiece.format}
- Tema: ${existingPiece.topic}
- Pilar: ${existingPiece.pillar}
- Objetivo: ${existingPiece.objective}

${feedback ? `## FEEDBACK DEL CLIENTE\n${feedback}` : ''}

## INSTRUCCIONES
Genera una nueva versión de esta pieza, manteniendo el tema y formato pero con:
- Nuevo hook más impactante
- Caption renovado totalmente alineado a la voz
- Concepto visual diferente
${existingPiece.format === 'CAROUSEL' ? '- Nueva estructura de slides' : ''}

Responde con el JSON de la pieza única (sin el array "pieces", solo el objeto de la pieza).
`

        const response = await this.anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 2000,
            temperature: 0.8, // Más creatividad para regeneración
            system: SYSTEM_PROMPT,
            messages: [
                { role: 'user', content: userPrompt }
            ],
        })

        const textContent = response.content.find(c => c.type === 'text')
        if (!textContent || textContent.type !== 'text') {
            throw new Error('No text response')
        }

        const jsonMatch = textContent.text.match(/\{[\s\S]*\}/)
        if (!jsonMatch) {
            throw new Error('No valid JSON')
        }

        return JSON.parse(jsonMatch[0])
    }
}

// Export singleton instance
export const contentWizard = new ContentWizardAgent()
