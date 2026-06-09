"use client";
import { Bell, LogOut, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/useUser";

export function Navbar() {
  const router   = useRouter();
  const supabase = createClient();
  const { profile } = useUser();

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-gray-100 bg-white/80 px-4 backdrop-blur-sm lg:px-6">
      <div className="flex items-center gap-2 lg:hidden">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600">
          <span className="text-xs font-bold text-white">CI</span>
        </div>
        <span className="text-sm font-semibold text-gray-900">ClockIN</span>
      </div>
      <div className="flex-1" />
      <div className="flex items-center gap-2">
        <button className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
          <Bell className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-2 rounded-lg border border-gray-100 px-2.5 py-1.5">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100">
            <User className="h-3.5 w-3.5 text-indigo-600" />
          </div>
          <span className="hidden text-xs font-medium text-gray-700 sm:block">
            {profile?.full_name ?? profile?.email ?? "Admin"}
          </span>
        </div>
        <button
          onClick={signOut}
          className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500"
          title="Sign out"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}