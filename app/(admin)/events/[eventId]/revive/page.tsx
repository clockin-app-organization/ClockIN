"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2, ChevronLeft, AlertTriangle, RotateCcw } from "lucide-react";
import Link from "next/link";

export default function ReviveEventPage() {
  const router = useRouter();
  const params = useParams();
  const supabase = createClient();

  const eventId = params.eventId as string;

  const [name, setName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    supabase
      .from("events")
      .select("name, event_date, start_time, end_time")
      .eq("id", eventId)
      .single()
      .then(({ data }) => {
        if (data) {
          setName(data.name ?? "");
          setEventDate(data.event_date ?? "");
          setStartTime(data.start_time ?? "");
          setEndTime(data.end_time ?? "");
        }
        setLoading(false);
      });
  }, [eventId, supabase]);

  function validate(): boolean {
    const errs: Record<string, string> = {};
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (!eventDate) {
      errs.eventDate = "Event date is required.";
    } else {
      const selectedDate = new Date(eventDate + "T00:00:00");
      if (selectedDate < today) {
        errs.eventDate = "Date cannot be in the past.";
      }
    }

    if (!startTime) {
      errs.startTime = "Start time is required.";
    } else if (eventDate && !errs.eventDate) {
      const startDt = new Date(`${eventDate}T${startTime}:00`);
      if (startDt <= now) {
        errs.startTime = "Start time must be in the future.";
      }
    }

    if (!endTime) {
      errs.endTime = "End time is required.";
    } else if (startTime && !errs.startTime) {
      const [sh, sm] = startTime.split(":").map(Number);
      const [eh, em] = endTime.split(":").map(Number);
      const diffMins = (eh * 60 + em) - (sh * 60 + sm);
      if (diffMins < 5) {
        errs.endTime = "End time must be at least 5 minutes after start time.";
      }
    }

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleRevive(e: React.FormEvent) {
    e.preventDefault();
    if (!note.trim()) {
      setError("A reason note is required.");
      return;
    }
    if (!validate()) return;
    setError("");
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();

    const { error: rpcError } = await supabase.rpc("revive_scope", {
      p_scope_type: "event",
      p_scope_id: eventId,
      p_note: note.trim(),
      p_revived_by: user?.id,
      p_event_date: eventDate,
      p_start_time: startTime,
      p_end_time: endTime,
    });

    if (rpcError) {
      setError(rpcError.message);
      setSaving(false);
      return;
    }

    router.push(`/events/${eventId}`);
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
        <Link href={`/events/${eventId}`} className="btn-ghost p-2">
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-xl font-semibold text-gray-900">Revive event</h1>
      </div>

      <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
        <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
        <span>
          <strong>{name}</strong> will be moved back to <em>upcoming</em>. Set a new date and time
          (cannot be in the past) so the event starts automatically.
        </span>
      </div>

      <form onSubmit={handleRevive} className="card space-y-4 p-6">
        <div>
          <label className="label">Event date *</label>
          <input
            type="date"
            value={eventDate}
            onChange={(e) => {
              setEventDate(e.target.value);
              if (fieldErrors.eventDate) setFieldErrors(p => ({ ...p, eventDate: "" }));
            }}
            className={`input-base ${fieldErrors.eventDate ? "border-red-300" : ""}`}
            required
          />
          {fieldErrors.eventDate && <p className="text-xs text-red-500 mt-1">{fieldErrors.eventDate}</p>}
        </div>
        <div>
          <label className="label">Start time *</label>
          <input
            type="time"
            value={startTime}
            onChange={(e) => {
              setStartTime(e.target.value);
              if (fieldErrors.startTime) setFieldErrors(p => ({ ...p, startTime: "" }));
            }}
            className={`input-base ${fieldErrors.startTime ? "border-red-300" : ""}`}
            required
          />
          {fieldErrors.startTime && <p className="text-xs text-red-500 mt-1">{fieldErrors.startTime}</p>}
        </div>
        <div>
          <label className="label">End time *</label>
          <input
            type="time"
            value={endTime}
            onChange={(e) => {
              setEndTime(e.target.value);
              if (fieldErrors.endTime) setFieldErrors(p => ({ ...p, endTime: "" }));
            }}
            className={`input-base ${fieldErrors.endTime ? "border-red-300" : ""}`}
            required
          />
          {fieldErrors.endTime && <p className="text-xs text-red-500 mt-1">{fieldErrors.endTime}</p>}
        </div>
        <div>
          <label className="label">Reason for revival *</label>
          <textarea
            required
            rows={4}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Event was rescheduled due to venue issue…"
            className="input-base resize-none"
          />
          <p className="mt-1 text-xs text-gray-400">
            This note is permanent and cannot be modified once saved.
          </p>
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
        <button type="submit" disabled={saving} className="btn-primary w-full">
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <RotateCcw className="h-4 w-4" /> Confirm revival
            </>
          )}
        </button>
      </form>
    </div>
  );
}