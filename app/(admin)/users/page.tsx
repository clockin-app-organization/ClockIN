// app/(admin)/users/page.tsx
import { createClient, getUser } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, Users } from "lucide-react";
import type { Profile } from "@/lib/types";

export const revalidate = 0;

export default async function UsersPage() {
  const user = await getUser();
  if (!user) {
    redirect("/login");
  }

  const supabase = await createClient();

  const { data: me } = await supabase
    .from("profiles")
    .select("is_super_admin")
    .eq("id", user.id)
    .single();

  if (!me?.is_super_admin) redirect("/dashboard");

  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-5 p-4 lg:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Admin accounts</h1>
        <Link href="/users/new" className="btn-primary">
          <Plus className="h-4 w-4" /> Add admin
        </Link>
      </div>

      {!profiles?.length ? (
        <div className="card flex flex-col items-center gap-3 py-16 text-center">
          <Users className="h-10 w-10 text-gray-300" />
          <p className="font-medium text-gray-500">No admins yet</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="divide-y divide-gray-50">
            {profiles.map((p: Profile) => (
              <Link
                key={p.id}
                href={`/users/${p.id}`}
                className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-600">
                  {(p.full_name || p.email)[0].toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold text-gray-900">{p.full_name || "—"}</p>
                    {p.is_super_admin && <span className="badge-upcoming text-[10px]">Super</span>}
                    {p.is_first_login && <span className="badge-pending text-[10px]">Pending setup</span>}
                  </div>
                  <p className="truncate text-xs text-gray-400">
                    {p.email}{p.institution ? ` · ${p.institution}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-full ${p.is_active ? "bg-green-500" : "bg-gray-300"}`} />
                  <span className="text-xs text-gray-400">{p.is_active ? "Active" : "Inactive"}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}