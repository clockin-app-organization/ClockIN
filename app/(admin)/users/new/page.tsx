// app/(admin)/users/new/page.tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2, ChevronLeft, Info, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'

export default function NewUserPage() {
  const router   = useRouter()
  const supabase = createClient()

  const [form, setForm] = useState({
    email:     '',
    full_name: '',
    phone:     '',
    password:  '',
    confirm:   '',
  })
  const [showPw,   setShowPw]   = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [success,  setSuccess]  = useState(false)

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (form.password !== form.confirm) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/create-admin`,
        {
          method: 'POST',
          headers: {
            'Content-Type':  'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            email:     form.email.toLowerCase().trim(),
            full_name: form.full_name.trim() || null,
            phone:     form.phone.trim() || null,
            password:  form.password,
          }),
        }
      )

      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Something went wrong.'); return }

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
        <h2 className="text-lg font-semibold text-gray-900">Admin created</h2>
        <p className="text-sm text-gray-500">
          <strong>{form.email}</strong> can now sign in with the password you set.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => {
              setSuccess(false)
              setForm({ email: '', full_name: '', phone: '', password: '', confirm: '' })
            }}
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
        The admin account will be created with the password you set. They can change it after signing in.
      </div>

      <form onSubmit={handleSubmit} className="card space-y-4 p-6">
        <div>
          <label className="label">Email address *</label>
          <input required type="email" className="input-base" placeholder="admin@moe.gov.sl"
            value={form.email} onChange={e => set('email', e.target.value)} />
        </div>
        <div>
          <label className="label">Full name</label>
          <input className="input-base" placeholder="Samuel Nicolls"
            value={form.full_name} onChange={e => set('full_name', e.target.value)} />
        </div>
        <div>
          <label className="label">Phone</label>
          <input type="tel" className="input-base" placeholder="+232 76 000 000"
            value={form.phone} onChange={e => set('phone', e.target.value)} />
        </div>

        <hr className="border-gray-100" />

        <div>
          <label className="label">Password *</label>
          <div className="relative">
            <input
              required
              type={showPw ? 'text' : 'password'}
              className="input-base pr-10"
              placeholder="Min. 8 characters"
              value={form.password}
              onChange={e => set('password', e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPw(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <div>
          <label className="label">Confirm password *</label>
          <input
            required
            type={showPw ? 'text' : 'password'}
            className="input-base"
            placeholder="Re-enter password"
            value={form.confirm}
            onChange={e => set('confirm', e.target.value)}
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