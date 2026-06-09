"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { BarChart3, Loader2, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router      = useRouter();
  const params      = useSearchParams();
  const supabase    = createClient();

  const [email,    setEmail]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [otpSent,  setOtpSent]  = useState(false);
  const [otp,      setOtp]      = useState("");

  const reason = params.get("reason");

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);

    // Check if this email was pre-added by super admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, is_first_login, is_active")
      .eq("email", email.toLowerCase().trim())
      .maybeSingle();

    if (profile && !profile.is_active) {
      setError("Your account has been deactivated. Contact your administrator.");
      setLoading(false);
      return;
    }

    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: email.toLowerCase().trim(),
      options: { shouldCreateUser: !!profile }, // only create if pre-added
    });

    if (otpError) {
      // Email not registered and not pre-added
      if (otpError.message.includes("Signups not allowed")) {
        setError("This email is not registered. Contact your administrator.");
      } else {
        setError(otpError.message);
      }
      setLoading(false);
      return;
    }

    setOtpSent(true);
    setLoading(false);
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);

    const { error: verifyError } = await supabase.auth.verifyOtp({
      email: email.toLowerCase().trim(),
      token: otp.trim(),
      type: "email",
    });

    if (verifyError) {
      setError("Invalid or expired code. Please try again.");
      setLoading(false);
      return;
    }

    // Middleware will handle first-login → onboarding redirect
    router.refresh();
    router.push("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-200">
            <BarChart3 className="h-7 w-7 text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">ClockIN</h1>
            <p className="text-sm text-gray-500">Attendance Management</p>
          </div>
        </div>

        {/* Inactive notice */}
        {reason === "inactive" && (
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            Your account has been deactivated.
          </div>
        )}

        <div className="card p-6">
          {!otpSent ? (
            <>
              <h2 className="mb-1 text-base font-semibold text-gray-900">Sign in</h2>
              <p className="mb-5 text-sm text-gray-500">
                We&apos;ll send a one-time code to your email.
              </p>
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="label">Email address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="input-base"
                  />
                </div>
                {error && (
                  <p className="flex items-center gap-1.5 text-xs text-red-600">
                    <AlertCircle className="h-3.5 w-3.5" /> {error}
                  </p>
                )}
                <button type="submit" disabled={loading} className="btn-primary w-full">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send code"}
                </button>
              </form>
            </>
          ) : (
            <>
              <h2 className="mb-1 text-base font-semibold text-gray-900">Enter your code</h2>
              <p className="mb-5 text-sm text-gray-500">
                Sent to <span className="font-medium text-gray-700">{email}</span>
              </p>
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <label className="label">One-time code</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    placeholder="123456"
                    className="input-base tracking-[0.3em] text-center text-lg"
                    autoFocus
                  />
                </div>
                {error && (
                  <p className="flex items-center gap-1.5 text-xs text-red-600">
                    <AlertCircle className="h-3.5 w-3.5" /> {error}
                  </p>
                )}
                <button type="submit" disabled={loading} className="btn-primary w-full">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify & sign in"}
                </button>
                <button
                  type="button"
                  onClick={() => { setOtpSent(false); setOtp(""); setError(""); }}
                  className="w-full text-center text-xs text-gray-400 hover:text-gray-600"
                >
                  Use a different email
                </button>
              </form>
            </>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">
          ClockIN &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}