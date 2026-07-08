// app/(auth)/login/LoginContent.tsx
"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { BarChart3, Loader2, AlertCircle, Eye, EyeOff, ArrowLeft, Clock, MapPin, Users } from "lucide-react";

type Step = "email" | "password" | "set-password";

export default function LoginContent() {
  const router   = useRouter();
  const params   = useSearchParams();
  const supabase = createClient();
  const reason   = params.get("reason");

  const [step,     setStep]     = useState<Step>("email");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  function resetToEmail() {
    setStep("email");
    setPassword("");
    setConfirm("");
    setError("");
    setShowPw(false);
  }

  // ── Step 1: verify email is pre-approved ──
  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);

    const { data: approved } = await supabase.rpc("is_email_pre_approved", {
      p_email: email.toLowerCase().trim(),
    });

    if (!approved) {
      setError("This email is not registered. Contact your administrator.");
      setLoading(false);
      return;
    }

    const { error: probeErr } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password: "__probe__",
    });

    if (probeErr?.message?.includes("Invalid login credentials")) {
      setStep("password");
    } else {
      setStep("set-password");
    }
    setLoading(false);
  }

  // ── Step 2a: returning user sign in ──
  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);

    const { error: err } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password,
    });

    if (err) {
      setError("Incorrect password. Please try again.");
      setLoading(false);
      return;
    }
    router.refresh();
    router.push("/dashboard");
  }

  // ── Step 2b: first login ──
  async function handleSetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (password !== confirm)  { setError("Passwords do not match."); return; }

    setLoading(true);
    const { error: signUpErr } = await supabase.auth.signUp({
      email: email.toLowerCase().trim(),
      password,
      options: { emailRedirectTo: undefined },
    });

    if (signUpErr) {
      setError(signUpErr.message);
      setLoading(false);
      return;
    }

    await supabase.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password,
    });
    router.refresh();
    router.push("/dashboard");
  }

  const eyeButton = (
    <button
      type="button"
      onClick={() => setShowPw(v => !v)}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
    >
      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
  );

  return (
    <div className="flex min-h-screen">
      {/* ── Left panel: app description ── */}
      <div className="hidden w-1/2 flex-col items-center justify-center bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 p-12 lg:flex">
        <div className="max-w-md">
          <div className="mb-8 flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
              <BarChart3 className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Smart Attendance</h1>
              <p className="text-indigo-200">Management System</p>
            </div>
          </div>

          <p className="mb-8 text-lg leading-relaxed text-indigo-100">
            A Smart Attendance System is an automated, digital solution designed to track and record attendance in real-time, eliminating manual paperwork.
          </p>

          <div className="space-y-5">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15">
                <Clock className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Real-time Tracking</h3>
                <p className="text-sm text-indigo-200">Precise attendance tracking with timestamps</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15">
                <MapPin className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Location Verification</h3>
                <p className="text-sm text-indigo-200">GPS-based attendance validation</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15">
                <Users className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Staff Management</h3>
                <p className="text-sm text-indigo-200">Comprehensive admin dashboard and reports</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right panel: login form ── */}
      <div className="flex w-full items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-4 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center gap-3 lg:hidden">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-200">
              <BarChart3 className="h-7 w-7 text-white" />
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900">Smart Attendance</h1>
              <p className="text-sm text-gray-500">Attendance Management</p>
            </div>
          </div>

          {reason === "inactive" && (
            <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              Your account has been deactivated. Contact your administrator.
            </div>
          )}

          <div className="card p-6">
            {step === "email" && (
              <>
                <h2 className="mb-1 text-base font-semibold text-center text-gray-900">Sign in</h2>
                <p className="mb-5 text-sm text-gray-500 text-center">Enter your email to continue.</p>
                <form onSubmit={handleEmailSubmit} className="space-y-4">
                  <div>
                    <label className="label">Email address</label>
                    <input
                      type="email" required autoFocus
                      value={email}
                      onChange={e => { setEmail(e.target.value); setError(""); }}
                      placeholder="you@moe.gov.sl"
                      className="input-base"
                    />
                  </div>
                  {error && (
                    <p className="flex items-center gap-1.5 text-xs text-red-600">
                      <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />{error}
                    </p>
                  )}
                  <button type="submit" disabled={loading} className="btn-primary w-full">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Continue"}
                  </button>
                </form>
              </>
            )}

            {step === "password" && (
              <>
                <button onClick={resetToEmail} className="mb-4 flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600">
                  <ArrowLeft className="h-3.5 w-3.5" /> Back
                </button>
                <h2 className="mb-1 text-base font-semibold text-gray-900">Welcome back,</h2>
                <p className="mb-5 truncate text-sm text-gray-500">{email}</p>
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div>
                    <label className="label">Password</label>
                    <div className="relative">
                      <input
                        type={showPw ? "text" : "password"} required autoFocus
                        value={password}
                        onChange={e => { setPassword(e.target.value); setError(""); }}
                        placeholder="••••••••"
                        className="input-base pr-10"
                      />
                      {eyeButton}
                    </div>
                  </div>
                  {error && (
                    <p className="flex items-center gap-1.5 text-xs text-red-600">
                      <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />{error}
                    </p>
                  )}
                  <button type="submit" disabled={loading} className="btn-primary w-full">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign in"}
                  </button>
                </form>
              </>
            )}

            {step === "set-password" && (
              <>
                <button onClick={resetToEmail} className="mb-4 flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600">
                  <ArrowLeft className="h-3.5 w-3.5" /> Back
                </button>
                <h2 className="mb-1 text-base font-semibold text-gray-900">Create your password</h2>
                <p className="mb-5 text-sm text-gray-500 text-center">
                  First login for <span className="font-medium text-gray-700">{email}</span>.
                  Set a password to secure your account.
                </p>
                <form onSubmit={handleSetPassword} className="space-y-4">
                  <div>
                    <label className="label">New password</label>
                    <div className="relative">
                      <input
                        type={showPw ? "text" : "password"} required autoFocus
                        value={password}
                        onChange={e => { setPassword(e.target.value); setError(""); }}
                        placeholder="Min. 8 characters"
                        className="input-base pr-10"
                      />
                      {eyeButton}
                    </div>
                  </div>
                  <div>
                    <label className="label">Confirm password</label>
                    <input
                      type={showPw ? "text" : "password"} required
                      value={confirm}
                      onChange={e => { setConfirm(e.target.value); setError(""); }}
                      placeholder="Re-enter password"
                      className="input-base"
                    />
                  </div>
                  {error && (
                    <p className="flex items-center gap-1.5 text-xs text-red-600">
                      <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />{error}
                    </p>
                  )}
                  <button type="submit" disabled={loading} className="btn-primary w-full">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Set password & continue"}
                  </button>
                </form>
              </>
            )}
          </div>

          <p className="mt-6 text-center text-xs text-gray-400">
            Smart Attendance &copy; {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
}