import { NextResponse } from 'next/server'
import { skillRegistry } from '@/lib/skills/registry'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { country, month, year, industry } = body

        if (!country || !month || !year) {
            return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 })
        }

        const result = await skillRegistry.invoke<any>('local_dates', {
            country,
            month,
            year,
            industry
        })

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 500 })
        }

        return NextResponse.json(result.output)
    } catch (error) {
        console.error('Error in local-dates skill:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
