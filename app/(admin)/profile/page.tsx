// app/(admin)/profile/page.tsx
'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Save, Eye, EyeOff, CheckCircle2 } from 'lucide-react'

type ProfileForm = { full_name: string; phone: string; institution: string }
type PwForm      = { newPw: string; confirm: string }

export default function ProfilePage() {
  const supabase = createClient()

  const [email,      setEmail]      = useState('')
  const [form,       setForm]       = useState<ProfileForm>({ full_name: '', phone: '', institution: '' })
  const [pwForm,     setPwForm]     = useState<PwForm>({ newPw: '', confirm: '' })
  const [showPw,     setShowPw]     = useState(false)
  const [loading,    setLoading]    = useState(true)
  const [saving,     setSaving]     = useState(false)
  const [pwSaving,   setPwSaving]   = useState(false)
  const [profileMsg, setProfileMsg] = useState('')
  const [profileErr, setProfileErr] = useState('')
  const [pwMsg,      setPwMsg]      = useState('')
  const [pwErr,      setPwErr]      = useState('')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (data) {
        setEmail(data.email ?? user.email ?? '')
        setForm({
          full_name:   data.full_name   ?? '',
          phone:       data.phone       ?? '',
          institution: data.institution ?? '',
        })
      }
      setLoading(false)
    }
    load()
  }, [])

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setProfileMsg('')
    setProfileErr('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setProfileErr('Not authenticated.'); setSaving(false); return }

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name:   form.full_name.trim()   || null,
        phone:       form.phone.trim()       || null,
        institution: form.institution.trim() || null,
      })
      .eq('id', user.id)

    setSaving(false)
    if (error) setProfileErr(error.message)
    else       setProfileMsg('Profile updated.')
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    setPwMsg('')
    setPwErr('')

    if (pwForm.newPw.length < 8)            { setPwErr('Password must be at least 8 characters.'); return }
    if (pwForm.newPw !== pwForm.confirm)     { setPwErr('Passwords do not match.'); return }

    setPwSaving(true)
    const { error } = await supabase.auth.updateUser({ password: pwForm.newPw })
    setPwSaving(false)

    if (error) setPwErr(error.message)
    else {
      setPwMsg('Password updated.')
      setPwForm({ newPw: '', confirm: '' })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl p-4 lg:p-6">
      <div className="mb-5">
        <h1 className="text-xl font-semibold text-gray-900">My profile</h1>
        <p className="mt-0.5 text-sm text-gray-500">Update your info and password</p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      {/* ── Personal info ── */}
      <form onSubmit={handleSaveProfile} className="card space-y-4 p-6">
        <h2 className="font-semibold text-gray-800">Personal info</h2>

        <div>
          <label className="label">Email</label>
          <input className="input-base cursor-not-allowed bg-gray-50 text-gray-400" value={email} disabled />
        </div>

        <div>
          <label className="label">Full name</label>
          <input
            className="input-base"
            placeholder="Samuel Nicolls"
            value={form.full_name}
            onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
          />
        </div>

        <div>
          <label className="label">Phone</label>
          <input
            type="tel"
            className="input-base"
            placeholder="+232 76 000 000"
            value={form.phone}
            onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
          />
        </div>

        <div>
          <label className="label">Institution</label>
          <input
            className="input-base"
            placeholder="Ministry of Education"
            value={form.institution}
            onChange={e => setForm(f => ({ ...f, institution: e.target.value }))}
          />
        </div>

        {profileMsg && (
          <p className="flex items-center gap-1.5 text-xs text-green-600">
            <CheckCircle2 className="h-3.5 w-3.5" /> {profileMsg}
          </p>
        )}
        {profileErr && <p className="text-xs text-red-600">{profileErr}</p>}

        <button type="submit" disabled={saving} className="btn-primary w-full">
          {saving
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : <><Save className="h-4 w-4" /> Save changes</>
          }
        </button>
      </form>

      {/* ── Change password ── */}
      <form onSubmit={handleChangePassword} className="card space-y-4 p-6">
        <h2 className="font-semibold text-gray-800">Change password</h2>

        <div>
          <label className="label">New password</label>
          <div className="relative">
            <input
              required
              type={showPw ? 'text' : 'password'}
              className="input-base pr-10"
              placeholder="Min. 8 characters"
              value={pwForm.newPw}
              onChange={e => setPwForm(f => ({ ...f, newPw: e.target.value }))}
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
          <label className="label">Confirm new password</label>
          <input
            required
            type={showPw ? 'text' : 'password'}
            className="input-base"
            placeholder="Re-enter new password"
            value={pwForm.confirm}
            onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))}
          />
        </div>

        {pwMsg && (
          <p className="flex items-center gap-1.5 text-xs text-green-600">
            <CheckCircle2 className="h-3.5 w-3.5" /> {pwMsg}
          </p>
        )}
        {pwErr && <p className="text-xs text-red-600">{pwErr}</p>}

        <button type="submit" disabled={pwSaving} className="btn-primary w-full">
          {pwSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Update password'}
        </button>
      </form>
      </div>
    </div>
  )
}