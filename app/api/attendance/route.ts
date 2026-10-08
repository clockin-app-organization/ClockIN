import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const body = await request.json()
  const supabase = await createClient()
  let { error } = await supabase.from('attendees').insert(body)

  if (error && body?.mda && (error.message.includes('mda') || error.message.includes('schema cache'))) {
    const fallbackBody = { ...body }
    delete fallbackBody.mda
    const retry = await supabase.from('attendees').insert(fallbackBody)
    error = retry.error
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}