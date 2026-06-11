// app/(admin)/users/new/page.tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2, ChevronLeft, Info } from 'lucide-react'
import Link from 'next/link'

export default function NewUserPage() {
  const router = useRouter()
  const supabase = createClient()

  const [form, setForm] = useState({ email: '', full_name: '', phone: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Get the caller's session token to pass to the edge function
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/create-admin`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            email:     form.email.toLowerCase().trim(),
            full_name: form.full_name.trim() || null,
            phone:     form.phone.trim() || null,
          }),
        }
      )

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Something went wrong.')
        return
      }

      setSuccess(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="mx-auto max-w-sm pt-10 text-center space-y-4 p-4">
        <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-green-50">
          <span className="text-3xl">✓</span>
        </div>
        <h2 className="text-lg font-semibold text-gray-900">Admin added</h2>
        <p className="text-sm text-gray-500">
          <strong>{form.email}</strong> has been created. They can now sign in with a magic link
          sent to their email, and will be prompted to complete their profile on first login.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => { setSuccess(false); setForm({ email: '', full_name: '', phone: '' }) }}
            className="btn-secondary"
          >
            Add another
          </button>
          <Link href="/users" className="btn-primary">Done</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md space-y-5 p-4 lg:p-6">
      <div className="flex items-center gap-3">
        <Link href="/users" className="btn-ghost p-2"><ChevronLeft className="h-4 w-4" /></Link>
        <h1 className="text-xl font-semibold">Add admin</h1>
      </div>

      <div className="flex items-start gap-2 rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
        <Info className="mt-0.5 h-4 w-4 flex-shrink-0" />
        The admin&apos;s account will be created immediately. They can sign in with a magic link
        sent to their email and will be prompted to complete their profile on first login.
      </div>

      <form onSubmit={handleSubmit} className="card space-y-4 p-6">
        <div>
          <label className="label">Email address *</label>
          <input
            required
            type="email"
            className="input-base"
            placeholder="admin@moe.gov.sl"
            value={form.email}
            onChange={e => set('email', e.target.value)}
          />
        </div>
        <div>
          <label className="label">Full name</label>
          <input
            className="input-base"
            placeholder="Samuel Nicolls"
            value={form.full_name}
            onChange={e => set('full_name', e.target.value)}
          />
        </div>
        <div>
          <label className="label">Phone</label>
          <input
            type="tel"
            className="input-base"
            placeholder="+232 76 000 000"
            value={form.phone}
            onChange={e => set('phone', e.target.value)}
          />
        </div>

        {error && <p className="text-xs text-red-600">{error}</p>}

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create admin account'}
        </button>
      </form>
    </div>
  )
}