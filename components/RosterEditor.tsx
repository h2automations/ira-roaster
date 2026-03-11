"use client";

import { useMemo, useState } from "react";
import {
  GENDER_OPTIONS,
  Gender,
  PRODUCT_OPTIONS,
  ProductKey,
  ProductQtyField,
  ProductSizeField,
  SLEEVE_TYPES,
  getSizeOptionsByGender,
  isValidProductKey
} from "../lib/products";

type PlayerRow = {
  id?: string;
  name: string;
  jerseyNumber: number | "";
  gender: string;
  sleeveType: string;
  sizeUS: string;
  playingTShirtQty: number | "";
  trousersSizeUS?: string | null;
  trousersQty?: number | null;
  trainingTShirtSizeUS?: string | null;
  trainingTShirtQty?: number | null;
  shortsSizeUS?: string | null;
  shortsQty?: number | null;
  jacketSizeUS?: string | null;
  jacketQty?: number | null;
  travelTrousersSizeUS?: string | null;
  travelTrousersQty?: number | null;
  sleevelessJacketSizeUS?: string | null;
  sleevelessJacketQty?: number | null;
  hoodieSizeUS?: string | null;
  hoodieQty?: number | null;
  travelPoloSizeUS?: string | null;
  travelPoloQty?: number | null;
  hatQty?: number | null;
  capQty?: number | null;
};

function toNumberOrEmpty(value: string): number | "" {
  if (value === "") return "";
  const parsed = Number(value);
  return Number.isNaN(parsed) ? "" : parsed;
}

function emptyPlayer(): PlayerRow {
  return {
    name: "",
    jerseyNumber: "",
    gender: "MEN",
    sleeveType: "HALF",
    sizeUS: "",
    playingTShirtQty: 1,
    trousersSizeUS: "",
    trousersQty: null,
    trainingTShirtSizeUS: "",
    trainingTShirtQty: null,
    shortsSizeUS: "",
    shortsQty: null,
    jacketSizeUS: "",
    jacketQty: null,
    travelTrousersSizeUS: "",
    travelTrousersQty: null,
    sleevelessJacketSizeUS: "",
    sleevelessJacketQty: null,
    hoodieSizeUS: "",
    hoodieQty: null,
    travelPoloSizeUS: "",
    travelPoloQty: null,
    hatQty: null,
    capQty: null
  };
}

export default function RosterEditor(props: {
  teamId: string;
  teamName: string;
  rosterTemplate: string;
  sharePin: string | null;
  allowEditExisting?: boolean;
  saveEndpoint?: string;
  enabledProducts: string[];
  initialRosterName: string;
  initialPlayers: PlayerRow[];
}) {
  const allowEditExisting = props.allowEditExisting ?? false;
  const saveEndpoint = props.saveEndpoint ?? "/api/roster/save";
  const enabledProducts = useMemo<ProductKey[]>(() => {
    return props.enabledProducts.filter(isValidProductKey);
  }, [props.enabledProducts]);

  const [rosterName, setRosterName] = useState(props.initialRosterName);
  const [players, setPlayers] = useState<PlayerRow[]>(
    props.initialPlayers.length > 0 ? props.initialPlayers : [emptyPlayer()]
  );
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [showExportConfirm, setShowExportConfirm] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [exportConfirmError, setExportConfirmError] = useState<string | null>(null);
  const [shareCopied, setShareCopied] = useState(false);

  function updatePlayer(index: number, field: keyof PlayerRow, value: string) {
    setPlayers((prev) => {
      const next = [...prev];
      const current = { ...next[index] };

      // Existing DB rows are immutable for team users.
      if (current.id && !allowEditExisting) return prev;

      setDirty(true);

      if (field === "jerseyNumber") {
        current.jerseyNumber = toNumberOrEmpty(value);
      } else if (field.endsWith("Qty")) {
        const qty = toNumberOrEmpty(value);
        (current as unknown as Record<string, number | null | "">)[field] =
          qty === "" ? null : qty;
      } else if (field === "gender") {
        current.gender = value;
      } else {
        (current as unknown as Record<string, string | null>)[field] = value;
      }

      next[index] = current;
      return next;
    });
  }

  function addRow() {
    setDirty(true);
    setPlayers((prev) => [...prev, emptyPlayer()]);
  }

  function deleteRow(index: number) {
    setPlayers((prev) => {
      const row = prev[index];
      if (row?.id && !allowEditExisting) return prev;
      setDirty(true);
      return prev.filter((_, i) => i !== index);
    });
  }

  function buildSavePayload() {
    const normalized = players.map((p) => ({
      ...p,
      name: p.name.trim()
    }));

    for (const p of normalized) {
      if (!p.id || allowEditExisting) {
        if (!p.name || p.jerseyNumber === "") {
          setMessage("Player name and jersey number are required for new rows.");
          return null;
        }

        for (const product of PRODUCT_OPTIONS.filter((opt) => enabledProducts.includes(opt.key))) {
          if ("sizeField" in product) {
            const sizeValue = String((p as unknown as Record<string, unknown>)[product.sizeField] || "");
            if (!sizeValue) {
              setMessage(`Size is required for ${product.label}.`);
              return null;
            }
          }
          if ("qtyField" in product) {
            const qtyRaw = (p as unknown as Record<string, unknown>)[product.qtyField];
            const qty = qtyRaw == null || qtyRaw === "" ? null : Number(qtyRaw);
            if (qty == null || Number.isNaN(qty) || qty < 0) {
              setMessage(`Valid quantity is required for ${product.label}.`);
              return null;
            }
          }
        }
      }
    }

    const jerseyNumbers = normalized
      .filter((p) => p.jerseyNumber !== "")
      .map((p) => p.jerseyNumber);
    const duplicates = jerseyNumbers.filter(
      (num, idx) => jerseyNumbers.indexOf(num) !== idx
    );
    if (duplicates.length > 0) {
      setWarning(
        "Warning: Duplicate jersey numbers detected."
      );
    }

    return {
      rosterName,
      players: normalized.map((p) => ({
        id: p.id,
        name: p.name,
        jerseyNumber: p.jerseyNumber,
        gender: p.gender,
        sleeveType: p.sleeveType,
        sizeUS: p.sizeUS || null,
        playingTShirtQty: p.playingTShirtQty === "" ? null : p.playingTShirtQty,
        trousersSizeUS: p.trousersSizeUS || null,
        trousersQty: p.trousersQty ?? null,
        trainingTShirtSizeUS: p.trainingTShirtSizeUS || null,
        trainingTShirtQty: p.trainingTShirtQty ?? null,
        shortsSizeUS: p.shortsSizeUS || null,
        shortsQty: p.shortsQty ?? null,
        jacketSizeUS: p.jacketSizeUS || null,
        jacketQty: p.jacketQty ?? null,
        travelTrousersSizeUS: p.travelTrousersSizeUS || null,
        travelTrousersQty: p.travelTrousersQty ?? null,
        sleevelessJacketSizeUS: p.sleevelessJacketSizeUS || null,
        sleevelessJacketQty: p.sleevelessJacketQty ?? null,
        hoodieSizeUS: p.hoodieSizeUS || null,
        hoodieQty: p.hoodieQty ?? null,
        travelPoloSizeUS: p.travelPoloSizeUS || null,
        travelPoloQty: p.travelPoloQty ?? null,
        hatQty: p.hatQty ?? null,
        capQty: p.capQty ?? null
      }))
    };
  }

  async function saveRoster(): Promise<boolean> {
    if (saving || exporting) return false;

    setMessage(null);
    setWarning(null);
    const payload = buildSavePayload();
    if (!payload) return false;

    setSaving(true);
    try {
      const res = await fetch(saveEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setMessage(data?.error || "Failed to save roster. Please try again.");
        return false;
      }
      const data = await res.json();
      setPlayers(data.players);
      setDirty(false);
      setMessage("Roster saved successfully.");
      return true;
    } finally {
      setSaving(false);
    }
  }

  async function exportRoster() {
    if (saving || exporting) return;
    setExporting(true);
    setMessage(null);
    try {
      const res = await fetch("/api/roster/export", {
        method: "GET"
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setMessage(
          data?.error || "Failed to export roster. Please try again later."
        );
        return;
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "team-roster.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  async function copyShareMessage() {
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_BASE_URL ||
      (typeof window !== "undefined" ? window.location.origin : "");

    const messageText = `IRA Sportswear Roster Update\nTeam: ${props.teamName}\nPIN: ${props.sharePin || "(PIN not available)"}\nLink: ${baseUrl}/roster/update\nOpen the link, select team, enter PIN, and update roster details.`;

    try {
      await navigator.clipboard.writeText(messageText);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 1500);
    } catch {
      setMessage("Unable to copy share message.");
    }
  }

  async function handleSave() {
    await saveRoster();
  }

  async function handleExport() {
    if (saving || exporting) return;
    if (!dirty) {
      await exportRoster();
      return;
    }

    setExportConfirmError(null);
    setShowExportConfirm(true);
  }

  async function handleSaveAndExport() {
    setExportConfirmError(null);
    const ok = await saveRoster();
    if (!ok) {
      setExportConfirmError("Unable to save roster. Please fix errors and try again.");
      return;
    }
    setShowExportConfirm(false);
    await exportRoster();
  }

  async function handleExportWithoutSaving() {
    setShowExportConfirm(false);
    setExportConfirmError(null);
    await exportRoster();
  }

  const enabledProductDefs = PRODUCT_OPTIONS.filter((p) =>
    enabledProducts.includes(p.key)
  );

  return (
    <div className="ira-card p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Roster Name
          </label>
          <input
            value={rosterName}
            onChange={(e) => {
              if (!allowEditExisting) return;
              setDirty(true);
              setRosterName(e.target.value);
            }}
            disabled={!allowEditExisting}
            className={`w-full rounded-lg border border-slate-300 px-3 py-2 text-sm ${
              allowEditExisting
                ? "bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-ira-navy/60"
                : "bg-slate-100 text-slate-600"
            }`}
          />
          <p className="mt-1 text-xs text-slate-500">
            {allowEditExisting
              ? "Admin mode: existing roster and players can be edited."
              : "Existing roster and existing players are locked to preserve historical records."}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={copyShareMessage}
            className="ira-button-secondary"
            disabled={saving || exporting}
          >
            {shareCopied ? "Copied" : "Share"}
          </button>
          <button
            type="button"
            onClick={handleExport}
            className="ira-button-secondary"
            disabled={saving || exporting}
          >
            {exporting ? "Exporting..." : "Export Excel"}
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="ira-button-primary"
            disabled={saving || exporting}
          >
            {saving ? "Saving..." : "Save Roster"}
          </button>
        </div>
      </div>

      {warning && (
        <div className="mb-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          {warning}
        </div>
      )}

      {message && (
        <div className="mb-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800">
          {message}
        </div>
      )}

      <div className="overflow-x-auto mt-2">
        <table className="min-w-max w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-3 py-2 text-left font-medium text-slate-700 min-w-[16rem]">
                Player Name
              </th>
              <th className="px-3 py-2 text-left font-medium text-slate-700">No.</th>
              <th className="px-3 py-2 text-left font-medium text-slate-700">Gender</th>
              <th className="px-3 py-2 text-left font-medium text-slate-700">Sleeve</th>
              {enabledProductDefs.map((product) => (
                <>
                  {"sizeField" in product && (
                    <th key={`${product.key}-size`} className="px-3 py-2 text-left font-medium text-slate-700">
                      {product.label} Size
                    </th>
                  )}
                  {"qtyField" in product && (
                    <th key={`${product.key}-qty`} className="px-3 py-2 text-left font-medium text-slate-700">
                      {product.label} Qty
                    </th>
                  )}
                </>
              ))}
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {players.map((player, index) => {
              const locked = Boolean(player.id) && !allowEditExisting;
              const inputClass = locked
                ? "bg-slate-100 text-slate-500"
                : "bg-white";

              return (
                <tr key={player.id ?? index} className="border-b border-slate-100">
                  <td className="px-3 py-2">
                    <input
                      value={player.name}
                      onChange={(e) => updatePlayer(index, "name", e.target.value)}
                      disabled={locked}
                      className={`w-full min-w-[16rem] rounded-md border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ira-navy/60 ${inputClass}`}
                      placeholder="Player name"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      value={player.jerseyNumber === "" ? "" : player.jerseyNumber}
                      onChange={(e) => updatePlayer(index, "jerseyNumber", e.target.value)}
                      inputMode="numeric"
                      pattern="\d*"
                      disabled={locked}
                      className={`w-20 rounded-md border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ira-navy/60 ${inputClass}`}
                      placeholder="0"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={player.gender}
                      onChange={(e) => updatePlayer(index, "gender", e.target.value)}
                      disabled={locked}
                      className={`w-28 rounded-md border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ira-navy/60 ${inputClass}`}
                    >
                      {GENDER_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={player.sleeveType}
                      onChange={(e) => updatePlayer(index, "sleeveType", e.target.value)}
                      disabled={locked}
                      className={`w-24 rounded-md border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ira-navy/60 ${inputClass}`}
                    >
                      {SLEEVE_TYPES.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </td>

                  {enabledProductDefs.map((product) => {
                    const sizeField = ("sizeField" in product
                      ? product.sizeField
                      : undefined) as ProductSizeField | undefined;
                    const qtyField = ("qtyField" in product
                      ? product.qtyField
                      : undefined) as ProductQtyField | undefined;
                    const sizeValue = sizeField
                      ? String((player as unknown as Record<string, unknown>)[sizeField] || "")
                      : "";
                    const qtyValue = qtyField
                      ? (player as unknown as Record<string, unknown>)[qtyField]
                      : "";

                    return (
                      <>
                        {sizeField && (
                          <td key={`${player.id ?? index}-${product.key}-size`} className="px-3 py-2">
                            <select
                              value={sizeValue}
                              onChange={(e) => updatePlayer(index, sizeField, e.target.value)}
                              disabled={locked}
                              className={`w-28 rounded-md border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ira-navy/60 ${inputClass}`}
                            >
                              <option value="">Select</option>
                              {getSizeOptionsByGender(
                                (GENDER_OPTIONS.includes(player.gender as Gender)
                                  ? player.gender
                                  : "MEN") as Gender
                              ).map((size) => (
                                <option key={size} value={size}>
                                  {size}
                                </option>
                              ))}
                            </select>
                          </td>
                        )}
                        {qtyField && (
                          <td key={`${player.id ?? index}-${product.key}-qty`} className="px-3 py-2">
                            <input
                              value={qtyValue == null ? "" : String(qtyValue)}
                              onChange={(e) => updatePlayer(index, qtyField, e.target.value)}
                              inputMode="numeric"
                              pattern="\d*"
                              disabled={locked}
                              className={`w-20 rounded-md border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ira-navy/60 ${inputClass}`}
                              placeholder="0"
                            />
                          </td>
                        )}
                      </>
                    );
                  })}

                  <td className="px-3 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => deleteRow(index)}
                      disabled={saving || exporting || locked}
                      className="text-xs text-red-600 hover:text-red-700 disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4">
        <button
          type="button"
          onClick={addRow}
          className="ira-button-secondary text-xs"
          disabled={saving || exporting}
        >
          Add Player
        </button>
      </div>

      {showExportConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-lg">
            <h2 className="text-base font-semibold text-ira-navy">Unsaved Changes</h2>
            <p className="mt-2 text-sm text-slate-700">
              You have unsaved roster changes. Choose how you want to export.
            </p>
            {exportConfirmError && (
              <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {exportConfirmError}
              </div>
            )}
            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                className="ira-button-primary"
                onClick={handleSaveAndExport}
                disabled={saving || exporting}
              >
                {saving ? "Saving..." : "Save & Export"}
              </button>
              <button
                type="button"
                className="ira-button-secondary"
                onClick={handleExportWithoutSaving}
                disabled={saving || exporting}
              >
                {exporting ? "Exporting..." : "Export Without Saving"}
              </button>
              <button
                type="button"
                className="ira-button-secondary"
                onClick={() => setShowExportConfirm(false)}
                disabled={saving || exporting}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
