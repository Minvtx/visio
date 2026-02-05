import { prisma } from '@/lib/prisma'

interface QARequest {
    content: string
    forbiddenWords: string[]
    requiredHashtags: string[]
    forbiddenHashtags: string[]
    tone: string
    hashtags: string[]
}

interface QAResult {
    passed: boolean
    score: number // 0-100
    violations: string[]
    suggestions: string[]
}

export async function runQualityCheck(request: QARequest): Promise<QAResult> {
    const violations: string[] = []
    const suggestions: string[] = []
    let score = 100

    // 1. Check Forbidden Words (Simple Regex)
    if (request.forbiddenWords.length > 0) {
        for (const word of request.forbiddenWords) {
            const regex = new RegExp(`\\b${word}\\b`, 'i')
            if (regex.test(request.content)) {
                violations.push(`Uso de palabra prohibida: "${word}"`)
                score -= 10
            }
        }
    }

    // 2. Check Hashtags
    if (request.hashtags.length > 30) {
        violations.push('Demasiados hashtags (máximo 30)')
        score -= 5
    }

    // Check required hashtags
    for (const tag of request.requiredHashtags) {
        const cleanTag = tag.replace('#', '')
        const hasTag = request.hashtags.some(h => h.replace('#', '').toLowerCase() === cleanTag.toLowerCase())
        if (!hasTag) {
            violations.push(`Falta hashtag requerido: #${cleanTag}`)
            score -= 5
        }
    }

    // Check forbidden hashtags
    for (const tag of request.forbiddenHashtags) {
        const cleanTag = tag.replace('#', '')
        const hasTag = request.hashtags.some(h => h.replace('#', '').toLowerCase() === cleanTag.toLowerCase())
        if (hasTag) {
            violations.push(`Uso de hashtag prohibido: #${cleanTag}`)
            score -= 10
        }
    }

    // 3. Length checks (Basic params)
    if (request.content.length < 10) {
        violations.push('El contenido es demasiado corto')
        score -= 20
    }

    // TODO: Integrate LLM for Tone Analysis (future iteration)
    // suggestions.push("El tono parece un poco más formal de lo esperado.")

    return {
        passed: score >= 80, // Umbral de aprobación
        score: Math.max(0, score),
        violations,
        suggestions
    }
}
