"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpRequested, setOtpRequested] = useState(false);
  const [loading, setLoading] = useState(false);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [teamId, setTeamId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const prefillEmail = params.get("email");
    const teamIdFromQuery = params.get("teamId");
    if (prefillEmail) {
      setEmail(prefillEmail);
    }
    setTeamId(teamIdFromQuery);
  }, []);

  async function requestOtp(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error || "Unable to request OTP.");
        return;
      }
      setOtpRequested(true);
      setDevOtp(data?.devOtp || null);
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp })
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error || "Unable to verify OTP.");
        return;
      }
      router.push(teamId ? `/admin/teams/${teamId}/products` : "/admin/teams");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md ira-card mx-auto p-6">
      <div className="mb-3 rounded-md border border-ira-navy/20 bg-blue-50 px-3 py-2 text-xs font-semibold text-ira-navy">
        Admin Mode
      </div>
      <Link href="/roster" className="inline-block mb-3 text-sm text-ira-navy underline">
        Back to Home
      </Link>
      <h1 className="text-xl font-semibold text-ira-navy mb-2">Admin Login</h1>
      <p className="text-sm text-slate-600 mb-6">
        Sign in with email and one-time passcode.
      </p>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {!otpRequested ? (
        <form className="space-y-4" onSubmit={requestOtp}>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ira-navy/60"
            />
          </div>
          <button type="submit" className="ira-button-primary" disabled={loading}>
            {loading ? "Requesting..." : "Request OTP"}
          </button>
        </form>
      ) : (
        <form className="space-y-4" onSubmit={verifyOtp}>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              OTP
            </label>
            <input
              required
              inputMode="numeric"
              pattern="\d*"
              minLength={6}
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ira-navy/60"
            />
          </div>
          {devOtp && (
            <p className="text-xs text-slate-500">Dev OTP: <span className="font-medium">{devOtp}</span></p>
          )}
          <div className="flex gap-2">
            <button type="submit" className="ira-button-primary" disabled={loading}>
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
            <button
              type="button"
              className="ira-button-secondary"
              disabled={loading}
              onClick={() => {
                setOtpRequested(false);
                setOtp("");
              }}
            >
              Back
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
