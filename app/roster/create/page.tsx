"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

const PIN_MIN = 4;
const PIN_MAX = 6;

export default function CreateRosterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const payload = {
      teamName: String(formData.get("teamName") || "").trim(),
      managerName: String(formData.get("managerName") || "").trim(),
      managerEmail: String(formData.get("managerEmail") || "").trim(),
      whatsappNumber: String(formData.get("whatsappNumber") || "").trim() || null,
      pin: String(formData.get("pin") || "").trim(),
      confirmPin: String(formData.get("confirmPin") || "").trim()
    };

    if (payload.pin !== payload.confirmPin) {
      setError("PIN and Confirm PIN must match.");
      setLoading(false);
      return;
    }
    if (
      payload.pin.length < PIN_MIN ||
      payload.pin.length > PIN_MAX ||
      !/^\d+$/.test(payload.pin)
    ) {
      setError("PIN must be 4–6 digits.");
      setLoading(false);
      return;
    }

    const res = await fetch("/api/roster/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error || "Failed to create roster. Please try again.");
      setLoading(false);
      return;
    }

    const data = await res.json().catch(() => null);
    const teamId = data?.id;
    const email = encodeURIComponent(payload.managerEmail);
    const next = teamId
      ? `/admin/login?email=${email}&teamId=${encodeURIComponent(teamId)}`
      : `/admin/login?email=${email}`;
    router.push(next);
  }

  return (
    <div className="max-w-xl ira-card mx-auto p-6">
      <h1 className="text-xl font-semibold text-ira-navy mb-2">
        Create New Team Roster
      </h1>
      <p className="text-sm text-slate-600 mb-6">
        Enter your team and manager details. Your secure PIN will be emailed
        immediately and optionally sent via WhatsApp.
      </p>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Team Name
          </label>
          <input
            name="teamName"
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ira-navy/60"
            placeholder="Example: IRA Falcons U18"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Manager Name
            </label>
            <input
              name="managerName"
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ira-navy/60"
              placeholder="Full name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Manager Email
            </label>
            <input
              name="managerEmail"
              type="email"
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ira-navy/60"
              placeholder="name@example.com"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Manager WhatsApp Number (optional)
          </label>
          <input
            name="whatsappNumber"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ira-navy/60"
            placeholder="Example: whatsapp:+123456789"
          />
          <p className="mt-1 text-xs text-slate-500">
            Used only to send your roster PIN via WhatsApp.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Create PIN (4–6 digits)
            </label>
            <input
              name="pin"
              required
              inputMode="numeric"
              pattern="\d*"
              minLength={PIN_MIN}
              maxLength={PIN_MAX}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ira-navy/60"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Confirm PIN
            </label>
            <input
              name="confirmPin"
              required
              inputMode="numeric"
              pattern="\d*"
              minLength={PIN_MIN}
              maxLength={PIN_MAX}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ira-navy/60"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            className="ira-button-secondary"
            onClick={() => router.push("/roster")}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="ira-button-primary"
            disabled={loading}
          >
            {loading ? "Creating..." : "Create Roster"}
          </button>
        </div>
      </form>
    </div>
  );
}
