import type { Profile } from '@/lib/types'
import { Bell } from 'lucide-react'

export default function TopBar({ profile }: { profile: Profile }) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4 pl-16 lg:pl-4">
      <p className="text-sm text-gray-500">
        Welcome back,{' '}
        <span className="font-semibold text-gray-900">
          {profile.full_name?.split(' ')[0] || 'Admin'}
        </span>
      </p>
      <div className="flex items-center gap-2">
        <button className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100">
          <Bell className="h-4 w-4" />
        </button>
        {profile.is_super_admin && (
          <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-600">
            Super Admin
          </span>
        )}
      </div>
    </header>
  )
}