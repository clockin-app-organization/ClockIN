import { NextResponse } from 'next/server'
import { validateAttendanceToken } from '@/lib/token-validation'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')?.trim()
  if (!token) {
    return NextResponse.json({ error: 'Missing token', valid: false }, { status: 400 })
  }

  const { data, error } = await validateAttendanceToken(token)
  if (error || !data) {
    return NextResponse.json(
      { error: error?.message || 'Invalid or expired token', valid: false },
      { status: 403 }
    )
  }

  return NextResponse.json({ valid: true, data })
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const token = typeof body?.token === 'string' ? body.token.trim() : null
  if (!token) {
    return NextResponse.json({ error: 'Missing token', valid: false }, { status: 400 })
  }

  const { data, error } = await validateAttendanceToken(token)
  if (error || !data) {
    return NextResponse.json(
      { error: error?.message || 'Invalid or expired token', valid: false },
      { status: 403 }
    )
  }

  return NextResponse.json({ valid: true, data })
}