// app/(admin)/events/[eventId]/sessions/[sessionId]/revive/page.tsx
"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2, ChevronLeft, AlertTriangle, RotateCcw } from "lucide-react";
import Link from "next/link";

export default function ReviveSessionPage() {
  const router   = useRouter();
  const params   = useParams();
  const supabase = createClient();

  const eventId   = params.eventId as string;
  const sessionId = params.sessionId as string;

  const [sessionName, setSessionName] = useState("");
  const [note,        setNote]        = useState("");
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState("");

  useEffect(() => {
    supabase
      .from("sessions")
      .select("name")
      .eq("id", sessionId)
      .single()
      .then(({ data }) => {
        setSessionName(data?.name ?? "");
        setLoading(false);
      });
  }, [sessionId, supabase]);

  async function handleRevive(e: React.FormEvent) {
    e.preventDefault();
    if (!note.trim()) { setError("A reason note is required."); return; }
    setError("");
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();

    const { error: rpcError } = await supabase.rpc("revive_scope", {
      p_scope_type: "session",
      p_scope_id:   sessionId,
      p_note:       note.trim(),
      p_revived_by: user?.id,
    });

    if (rpcError) {
      setError(rpcError.message);
      setSaving(false);
      return;
    }

    router.push(`/events/${eventId}/sessions/${sessionId}`);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-5 p-4 lg:p-6">
      <div className="flex items-center gap-3">
        <Link href={`/events/${eventId}/sessions/${sessionId}`} className="btn-ghost p-2">
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-xl font-semibold text-gray-900">Revive session</h1>
      </div>

      <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
        <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
        <span>
          <strong>{sessionName}</strong> will be moved back to <em>pending</em> and its QR token
          re-activated. A reason note is mandatory and cannot be edited later.
        </span>
      </div>

      <form onSubmit={handleRevive} className="card space-y-4 p-6">
        <div>
          <label className="label">Reason for revival *</label>
          <textarea
            required
            rows={4}
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="e.g. Session was postponed due to speaker availability…"
            className="input-base resize-none"
          />
          <p className="mt-1 text-xs text-gray-400">
            This note is permanent and cannot be modified once saved.
          </p>
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
        <button type="submit" disabled={saving} className="btn-primary w-full">
          {saving
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : <><RotateCcw className="h-4 w-4" /> Confirm revival</>
          }
        </button>
      </form>
    </div>
  );
}