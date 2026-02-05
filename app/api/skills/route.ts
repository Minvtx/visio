import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { skillRegistry } from '@/lib/skills/registry'

// GET /api/skills - List all available skills
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const category = searchParams.get('category')

        const skills = skillRegistry.list(category || undefined).map(skill => ({
            id: skill.id,
            name: skill.name,
            category: skill.category,
            description: skill.description,
            inputSchema: skill.inputSchema,
            outputSchema: skill.outputSchema,
        }))

        // Group by category
        const grouped = skills.reduce((acc, skill) => {
            if (!acc[skill.category]) {
                acc[skill.category] = []
            }
            acc[skill.category].push(skill)
            return acc
        }, {} as Record<string, typeof skills>)

        return NextResponse.json({
            total: skills.length,
            skills,
            byCategory: grouped,
        })
    } catch (error) {
        console.error('Error listing skills:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

