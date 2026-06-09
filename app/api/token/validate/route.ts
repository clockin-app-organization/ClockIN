import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 })

  const supabase = await createClient()
  const { data, error } = await supabase.rpc('validate_attendance_token', { p_token: token })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ valid: !!data, data })
}