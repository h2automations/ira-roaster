"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

type TeamOption = {
  id: string;
  name: string;
};

export default function UpdateRosterPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [teams, setTeams] = useState<TeamOption[]>([]);
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [selectedTeamName, setSelectedTeamName] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    async function loadTeams() {
      const value = query.trim();
      if (!value) {
        setTeams([]);
        setSelectedTeamId("");
        setSelectedTeamName("");
        return;
      }
      try {
        setSearching(true);
        const res = await fetch(`/api/teams?q=${encodeURIComponent(value)}`);
        if (!res.ok) throw new Error("Failed to load teams");
        const data: TeamOption[] = await res.json();
        if (!cancelled) {
          setTeams(data);
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) setError("Unable to load teams. Please try again later.");
      } finally {
        if (!cancelled) setSearching(false);
      }
    }
    loadTeams();
    return () => {
      cancelled = true;
    };
  }, [query]);

async function handleSubmit(e: FormEvent<HTMLFormElement>) {
  e.preventDefault();
  setError(null);

  if (!selectedTeamId) {
    setError("Please select a team.");
    return;
  }

  const formData = new FormData(e.currentTarget);
  const pin = String(formData.get("pin") || "").trim();

  if (!pin) {
    setError("Please enter your PIN.");
    return;
  }

  setSubmitting(true);

  try {
    const res = await fetch("/api/auth/verify-pin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teamId: selectedTeamId, pin })
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(
        data?.error ||
          "Unable to verify details. Please check your Team and PIN and try again."
      );
      setSubmitting(false);
      return;
    }

    // ✅ stop spinner before navigating
    setSubmitting(false);
    router.replace("/roster/edit");
  } catch {
    setError("Network error. Try again.");
    setSubmitting(false);
  }
}


  return (
    <div className="max-w-xl ira-card mx-auto p-6">
      <h1 className="text-xl font-semibold text-ira-navy mb-2">
        Update Existing Roster
      </h1>
      <p className="text-sm text-slate-600 mb-6">
        Select your team and enter the PIN that was emailed when the roster was
        first created.
      </p>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Team
          </label>
          <input
            value={query}
            onChange={(e) => {
              setError(null);
              setQuery(e.target.value);
              setSelectedTeamId("");
              setSelectedTeamName("");
            }}
            placeholder="Start typing team name"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ira-navy/60"
          />
          {!!query.trim() && (
            <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow">
              {searching ? (
                <p className="px-3 py-2 text-sm text-slate-500">Searching…</p>
              ) : teams.length === 0 ? (
                <p className="px-3 py-2 text-sm text-slate-500">
                  No matching teams found.
                </p>
              ) : (
                teams.map((team) => (
                  <button
                    key={team.id}
                    type="button"
                    onClick={() => {
                      setSelectedTeamId(team.id);
                      setSelectedTeamName(team.name);
                      setQuery(team.name);
                      setTeams([]);
                    }}
                    className="block w-full px-3 py-2 text-left text-sm hover:bg-blue-50"
                  >
                    {team.name}
                  </button>
                ))
              )}
            </div>
          )}
          {selectedTeamName && (
            <p className="mt-1 text-xs text-slate-500">
              Selected: <span className="font-medium">{selectedTeamName}</span>
            </p>
          )}
        </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              PIN
            </label>
            <input
              name="pin"
              type="password"
              inputMode="numeric"
              pattern="\d*"
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ira-navy/60"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              className="ira-button-secondary"
              onClick={() => router.push("/roster")}
            >
              Back
            </button>
            <button
              type="submit"
              className="ira-button-primary"
              disabled={submitting}
            >
              {submitting ? "Verifying..." : "Continue to Roster"}
            </button>
          </div>
      </form>
    </div>
  );
}
