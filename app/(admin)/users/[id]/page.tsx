// app/(admin)/users/[id]/page.tsx
import { createClient, getUser } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  Mail,
  Phone,
  Building,
  Tag,
  Shield,
  CheckCircle,
  XCircle,
} from "lucide-react";

export const revalidate = 0;

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getUser();
  if (!user) {
    redirect("/login");
  }
  const supabase = await createClient();

  // Only super admins can view
  const { data: me } = await supabase
    .from("profiles")
    .select("is_super_admin")
    .eq("id", user.id)
    .single();

  if (!me?.is_super_admin) redirect("/dashboard");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();

  if (!profile) notFound();

  return (
    <div className="space-y-6 p-4 lg:p-6 max-w-xl mx-auto">
      <div className="flex items-center gap-3">
        <Link href="/users" className="btn-ghost p-2">
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-xl font-semibold text-gray-900">Admin details</h1>
      </div>

      <div className="card p-6 space-y-5">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-lg font-bold text-indigo-600">
            {(profile.full_name || profile.email)[0].toUpperCase()}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {profile.full_name || "—"}
            </h2>
            <p className="text-sm text-gray-500">{profile.email}</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4 text-gray-400" />
            <span className="font-medium">Email:</span>
            <span>{profile.email}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-4 w-4 text-gray-400" />
            <span className="font-medium">Phone:</span>
            <span>{profile.phone || "—"}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Building className="h-4 w-4 text-gray-400" />
            <span className="font-medium">Institution:</span>
            <span>{profile.institution || "—"}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Tag className="h-4 w-4 text-gray-400" />
            <span className="font-medium">Designation:</span>
            <span>{profile.designation || "—"}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Tag className="h-4 w-4 text-gray-400" />
            <span className="font-medium">District:</span>
            <span>{profile.district || "—"}</span>
          </div>
        </div>

        <hr className="border-gray-100" />

        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <Shield className="h-4 w-4 text-gray-400" />
            <span className="font-medium">Super admin:</span>
            {profile.is_super_admin ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <XCircle className="h-4 w-4 text-gray-300" />
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-medium">Active:</span>
            {profile.is_active ? (
              <span className="text-green-600">Yes</span>
            ) : (
              <span className="text-red-500">No</span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-medium">First login:</span>
            {profile.is_first_login ? "Yes" : "No"}
          </div>
        </div>

        <p className="text-xs text-gray-400">
          Created: {new Date(profile.created_at).toLocaleString()}
          <br />
          Updated: {new Date(profile.updated_at).toLocaleString()}
        </p>

        <div className="flex gap-3 pt-2">
          <Link href={`/users/${profile.id}/edit`} className="btn-secondary">
            Edit
          </Link>
          <Link href="/users" className="btn-ghost">
            Back to list
          </Link>
        </div>
      </div>
    </div>
  );
}
