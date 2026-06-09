import { Navbar } from '@/components/ui/Navbar'   // ✅ named import
import Sidebar from './Sidebar'
import { requireAuth } from '@/lib/auth'

export default async function AdminShell({ children }: { children: React.ReactNode }) {
  const profile = await requireAuth()   // automatically redirects if not authenticated

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar profile={profile} />
      <div className="md:pl-64">
        <Navbar />
        <main className="p-4 md:p-6 max-w-7xl mx-auto">
          {children}
        </main>
      </div>
    </div>
  )
}