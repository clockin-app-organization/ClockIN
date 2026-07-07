import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_super_admin")
    .eq("id", user.id)
    .single()

  const isSuperAdmin = profile?.is_super_admin ?? false

  const now = new Date()
  const currentYear = now.getFullYear()
  const janFirst = `${currentYear}-01-01T00:00:00.000Z`

  let rows: { created_at: string }[] = []

  if (isSuperAdmin) {
    const { data } = await supabase
      .from("attendees")
      .select("created_at")
      .gte("created_at", janFirst)
    rows = data ?? []
  } else {
    const { data: myEvents } = await supabase
      .from("events")
      .select("id")
      .eq("created_by", user.id)

    const eventIds = (myEvents ?? []).map(e => e.id)
    if (eventIds.length === 0) {
      return NextResponse.json(generateEmptyMonths(currentYear))
    }

    const { data } = await supabase
      .from("attendees")
      .select("created_at")
      .in("event_id", eventIds)
      .gte("created_at", janFirst)
    rows = data ?? []
  }

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  const monthlyMap = new Map<string, number>()
  for (let i = 0; i < 12; i++) {
    const key = `${currentYear}-${String(i + 1).padStart(2, '0')}`
    monthlyMap.set(key, 0)
  }

  for (const row of rows) {
    const d = new Date(row.created_at)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (monthlyMap.has(key)) {
      monthlyMap.set(key, (monthlyMap.get(key) ?? 0) + 1)
    }
  }

  const result = months.map((month, i) => {
    const key = `${currentYear}-${String(i + 1).padStart(2, '0')}`
    return { month, count: monthlyMap.get(key) ?? 0 }
  })

  return NextResponse.json(result)
}

function generateEmptyMonths(year: number) {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  return months.map(month => ({ month, count: 0 }))
}
