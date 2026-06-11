// app/(admin)/layout.tsx
import { redirect } from "next/navigation";
import { getProfile } from "@/lib/supabase/server";
import Sidebar from "@/components/layout/Sidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await getProfile();

  if (!profile)               redirect("/login");
  if (profile.is_first_login) redirect("/onboarding");

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar profile={profile} />
      <main className="flex-1 overflow-y-auto">
        {/* top padding on mobile to clear the hamburger button */}
        <div className="pt-14 lg:pt-0 min-h-full">
          {children}
        </div>
      </main>
    </div>
  );
}