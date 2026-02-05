// Visual Wizard Agent - Expert in Social Media Design
// Specializes in Instagram visual content, layouts, and design briefs

import Anthropic from '@anthropic-ai/sdk'
import { GeneratedPiece } from './content-wizard'

// Types for Visual Wizard
export interface BrandVisualKit {
    primaryColors: string[]
    secondaryColors: string[]
    fonts: {
        heading: string
        body: string
    }
    style: string // "Moderno minimalista", "Vibrante y colorido", etc.
    logoUrl?: string
}

export interface VisualOutput {
    format: 'POST' | 'CAROUSEL' | 'REEL' | 'STORY'
    dimensions: { width: number; height: number }
    designBrief: string
    textOverlays: Array<{
        text: string
        position: 'top' | 'center' | 'bottom' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
        size: 'small' | 'medium' | 'large' | 'xlarge'
        style: 'heading' | 'subheading' | 'body' | 'accent'
    }>
    visualElements: {
        background: string
        mainVisual: string
        decorativeElements: string[]
        iconography: string[]
    }
    colorUsage: {
        background: string
        text: string
        accents: string[]
    }
    layoutDescription: string
    midjourneyPrompt: string
    dallePrompt: string
    photoshopNotes: string
    carouselSlideDesigns?: Array<{
        slideNumber: number
        layout: string
        textContent: string
        visualDescription: string
    }>
}

// Visual design expertise knowledge base
const VISUAL_EXPERTISE = `
## 🎨 EXPERTISE: DISEÑO VISUAL PARA INSTAGRAM 2026

### DIMENSIONES POR FORMATO
| Formato | Dimensiones | Aspect Ratio |
|---------|-------------|--------------|
| Post Feed | 1080x1080 | 1:1 |
| Post Vertical | 1080x1350 | 4:5 (recomendado) |
| Carousel | 1080x1350 | 4:5 por slide |
| Reel/Story | 1080x1920 | 9:16 |
| Reel Cover | 1080x1920 | 9:16 (pero 1080x1080 visible en feed) |

### TENDENCIAS VISUALES 2026
1. **Diseño limpio y minimalista** - Menos es más
2. **Gradientes suaves** - Transiciones de color elegantes
3. **Tipografía bold** - Títulos grandes y legibles
4. **Glassmorphism sutil** - Efecto de cristal esmerilado
5. **Ilustraciones personalizadas** - Estilo único de marca
6. **Fotografía auténtica** - Menos stock, más real
7. **Colores vibrantes** - Destacar en el feed
8. **Asymmetric layouts** - Romper la cuadrícula tradicional
9. **Motion graphics** - Animaciones sutiles
10. **3D elements** - Profundidad y dinamismo

### JERARQUÍA VISUAL EN MOBILE
1. **Título/Hook** - Lo primero que se lee (grande, contrastado)
2. **Visual principal** - Imagen o ilustración que atrae
3. **Texto secundario** - Información de apoyo
4. **CTA/Branding** - Cierre de la pieza
5. **Elementos decorativos** - Complementan, no compiten

### TIPOGRAFÍA PARA INSTAGRAM
- **Títulos**: 48-72px mínimo (legible en mobile)
- **Subtítulos**: 32-40px
- **Body text**: 24-32px
- **Captions en imagen**: 20-28px
- **Máximo 2 familias tipográficas** por pieza
- **Line height**: 1.2-1.4 para legibilidad

### CARRUSELES: DISEÑO SLIDE POR SLIDE
**Slide 1 (Cover)**:
- Hook visual IMPACTANTE
- Título grande y llamativo
- Colores de marca prominentes
- Sin demasiado texto (3-5 palabras)

**Slides 2-8 (Contenido)**:
- Layout consistente entre slides
- Un punto por slide
- Numeración o progreso visual
- Iconografía de apoyo
- Máximo 30-40 palabras por slide

**Slide Final (CTA)**:
- Llamada a la acción clara
- Recordatorio de seguir/guardar
- Logo o branding sutil
- Puede incluir oferta/beneficio

### REEL COVERS
- Texto grande y legible
- No depender del área central (puede ser cortada)
- Coherencia visual con el contenido del Reel
- Thumbnail que genere curiosidad

### STORIES: DISEÑO EFECTIVO
- **Safe zone**: No poner texto en bordes superior/inferior
- Elementos interactivos (encuestas, preguntas) integrados
- Diseño efímero pero branded
- Fondos que no compitan con el texto

### PALETA DE COLORES
- **3-5 colores máximo** por pieza
- **60-30-10 rule**: 60% dominante, 30% secundario, 10% acento
- **Contraste mínimo 4.5:1** para accesibilidad
- Colores consistentes con la identidad de marca

### ELEMENTOS QUE FUNCIONAN
✅ Iconos simples y reconocibles
✅ Flechas y líneas guía
✅ Números grandes para listas
✅ Checkmarks y bullets
✅ Marcos y bordes sutiles
✅ Sombras suaves
✅ Espaciado generoso (whitespace)

### ELEMENTOS A EVITAR
❌ Demasiados colores
❌ Texto pequeño ilegible
❌ Fondos ruidosos que compiten
❌ Logos enormes
❌ Bordes de imagen cortados
❌ Clipart genérico
❌ Efectos excesivos
`

const SYSTEM_PROMPT = `Eres el Visual Wizard, un director de arte experto en diseño para redes sociales, especializado en Instagram.

${VISUAL_EXPERTISE}

## TU MISIÓN
Crear briefs de diseño detallados y profesionales que un diseñador pueda ejecutar en Photoshop/Figma, más prompts para generación de imágenes con IA.

## REGLAS DE DISEÑO
1. SIEMPRE respeta la identidad visual de la marca (colores, fonts)
2. PRIORIZA legibilidad en mobile (textos grandes)
3. GENERA prompts específicos para Midjourney y DALL-E
4. INCLUYE notas técnicas para Photoshop
5. Para CARRUSELES, diseña cada slide individualmente
6. MANTÉN coherencia visual entre todas las piezas
7. CONSIDERA la safe zone de cada formato
8. USA la jerarquía visual correctamente

## FORMATO DE RESPUESTA
Responde ÚNICAMENTE con JSON válido:
{
  "format": "POST" | "CAROUSEL" | "REEL" | "STORY",
  "dimensions": {"width": number, "height": number},
  "designBrief": "string (descripción general del diseño)",
  "textOverlays": [
    {
      "text": "string",
      "position": "top|center|bottom|top-left|top-right|bottom-left|bottom-right",
      "size": "small|medium|large|xlarge",
      "style": "heading|subheading|body|accent"
    }
  ],
  "visualElements": {
    "background": "string (descripción del fondo)",
    "mainVisual": "string (imagen o ilustración principal)",
    "decorativeElements": ["string"],
    "iconography": ["string"]
  },
  "colorUsage": {
    "background": "string (color hex o descripción)",
    "text": "string",
    "accents": ["string"]
  },
  "layoutDescription": "string (descripción detallada del layout)",
  "midjourneyPrompt": "string (prompt optimizado para Midjourney v6)",
  "dallePrompt": "string (prompt optimizado para DALL-E 3)",
  "photoshopNotes": "string (notas técnicas para el diseñador)",
  "carouselSlideDesigns": [ // Solo si es CAROUSEL
    {
      "slideNumber": number,
      "layout": "string",
      "textContent": "string",
      "visualDescription": "string"
    }
  ]
}`

class VisualWizardAgent {
    private anthropic: Anthropic

    constructor() {
        this.anthropic = new Anthropic({
            apiKey: process.env.ANTHROPIC_API_KEY,
        })
    }

    async generateVisual(
        piece: GeneratedPiece,
        brandKit: BrandVisualKit
    ): Promise<VisualOutput> {
        const userPrompt = `
## IDENTIDAD VISUAL DE LA MARCA
- **Colores primarios**: ${brandKit.primaryColors.join(', ')}
- **Colores secundarios**: ${brandKit.secondaryColors.join(', ')}
- **Tipografía títulos**: ${brandKit.fonts.heading}
- **Tipografía cuerpo**: ${brandKit.fonts.body}
- **Estilo visual**: ${brandKit.style}

## PIEZA DE CONTENIDO
- **Formato**: ${piece.format}
- **Tema**: ${piece.topic}
- **Pilar**: ${piece.pillar}
- **Objetivo**: ${piece.objective}

## HOOK SELECCIONADO
"${piece.hooks[0]?.text || piece.topic}"

## CONCEPTO VISUAL (del Content Wizard)
${piece.visualConcept}

## CAPTION CORTO (para Stories/Reels)
${piece.captionShort}

${piece.format === 'CAROUSEL' && piece.carouselSlides ? `
## ESTRUCTURA DEL CARRUSEL
${piece.carouselSlides.map(s => `- Slide ${s.slideNumber}: ${s.content} (${s.purpose})`).join('\n')}
` : ''}

## INSTRUCCIONES
Genera un brief de diseño completo para esta pieza. El brief debe ser tan detallado que un diseñador pueda ejecutarlo sin preguntas adicionales.

Los prompts de Midjourney y DALL-E deben generar imágenes que complementen el diseño (backgrounds, ilustraciones, fotografías de apoyo).
`

        try {
            const response = await this.anthropic.messages.create({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 4000,
                temperature: 0.6,
                system: SYSTEM_PROMPT,
                messages: [
                    { role: 'user', content: userPrompt }
                ],
            })

            const textContent = response.content.find(c => c.type === 'text')
            if (!textContent || textContent.type !== 'text') {
                throw new Error('No text response from Visual Wizard')
            }

            const jsonMatch = textContent.text.match(/\{[\s\S]*\}/)
            if (!jsonMatch) {
                throw new Error('No valid JSON in Visual Wizard response')
            }

            return JSON.parse(jsonMatch[0])
        } catch (error) {
            console.error('Visual Wizard Error:', error)
            throw error
        }
    }

    // Generate visuals for all pieces in batch (more efficient)
    async generateBatchVisuals(
        pieces: GeneratedPiece[],
        brandKit: BrandVisualKit
    ): Promise<Map<number, VisualOutput>> {
        const results = new Map<number, VisualOutput>()

        // Process in parallel with concurrency limit
        const batchSize = 5
        for (let i = 0; i < pieces.length; i += batchSize) {
            const batch = pieces.slice(i, i + batchSize)
            const promises = batch.map(async (piece, idx) => {
                const visual = await this.generateVisual(piece, brandKit)
                results.set(piece.dayOfMonth, visual)
            })
            await Promise.all(promises)
        }

        return results
    }

    // Generate only the image prompts (faster, cheaper)
    async generateImagePrompts(
        piece: GeneratedPiece,
        brandKit: BrandVisualKit
    ): Promise<{ midjourney: string; dalle: string }> {
        const userPrompt = `
## CONTEXTO
- Marca estilo: ${brandKit.style}
- Colores: ${brandKit.primaryColors.join(', ')}
- Formato: ${piece.format}
- Tema: ${piece.topic}
- Concepto visual: ${piece.visualConcept}

## TAREA
Genera SOLO los prompts para generar imágenes:
1. Prompt para Midjourney v6 (optimizado con parámetros)
2. Prompt para DALL-E 3

Responde en JSON:
{
  "midjourney": "string (prompt con --ar, --v 6, --style, etc.)",
  "dalle": "string (prompt descriptivo para DALL-E 3)"
}
`

        const response = await this.anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 800,
            temperature: 0.7,
            system: 'Eres un experto en prompt engineering para generación de imágenes con IA. Generas prompts optimizados para Midjourney y DALL-E.',
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
export const visualWizard = new VisualWizardAgent()
