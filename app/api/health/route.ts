import { NextResponse } from 'next/server'

export async function GET() {
    return NextResponse.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        env: {
            appUrl: process.env.NEXT_PUBLIC_APP_URL || 'missing',
            keyPresent: !!process.env.ANTHROPIC_API_KEY
        }
    })
}
