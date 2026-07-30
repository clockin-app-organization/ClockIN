// app/(auth)/onboarding/page.tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [institution, setInstitution] = useState('')
  const [designation, setDesignation] = useState('')
  const [district, setDistrict] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        full_name: fullName.trim(),
        phone,
        institution,
        designation,
        district,
        is_first_login: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }

    router.refresh()
    router.push('/dashboard')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 to-white px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Complete Your Profile</h1>
          <p className="text-sm text-gray-500">Set up your account before continuing</p>
        </div>
        <div className="card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Full Name *</label>
              <input required value={fullName} onChange={e => setFullName(e.target.value)} className="input-base" />
            </div>
            <div>
              <label className="label">Phone</label>
              <input value={phone} onChange={e => setPhone(e.target.value)} className="input-base" />
            </div>
            <div>
              <label className="label">Institution</label>
              <input value={institution} onChange={e => setInstitution(e.target.value)} className="input-base" />
            </div>
            <div>
              <label className="label">Designation</label>
              <input value={designation} onChange={e => setDesignation(e.target.value)} className="input-base" />
            </div>
            <div>
              <label className="label">District</label>
              <input value={district} onChange={e => setDistrict(e.target.value)} className="input-base" />
            </div>
            {error && <p className="text-xs text-red-600">{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Complete Setup'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}