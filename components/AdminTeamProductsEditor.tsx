"use client";

import { useMemo, useState } from "react";
import {
  PRODUCT_OPTIONS,
  ProductKey,
  isValidProductKey
} from "../lib/products";

export default function AdminTeamProductsEditor(props: {
  teamId: string;
  teamName: string;
  sharePin: string | null;
  initialEnabledProducts: string[];
}) {
  const initialSelected = useMemo<ProductKey[]>(() => {
    return props.initialEnabledProducts.filter(isValidProductKey);
  }, [props.initialEnabledProducts]);

  const [selected, setSelected] = useState<ProductKey[]>(initialSelected);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function toggleProduct(key: ProductKey) {
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]
    );
  }

  async function saveProducts() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/teams/${props.teamId}/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabledProducts: selected })
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setMessage(data?.error || "Unable to save products.");
        return;
      }
      setMessage("Product settings saved.");
    } finally {
      setSaving(false);
    }
  }

  async function copyShareMessage() {
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_BASE_URL ||
      (typeof window !== "undefined" ? window.location.origin : "");

    const messageText = `IRA Sportswear Roster Update\nTeam: ${props.teamName}\nPIN: ${props.sharePin || "(PIN not available)"}\nLink: ${baseUrl}/roster/update\nOpen the link, select team, enter PIN, and update jersey numbers + sizes.`;

    try {
      await navigator.clipboard.writeText(messageText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setMessage("Unable to copy share message.");
    }
  }

  async function exportRoster() {
    setExporting(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/teams/${props.teamId}/export`);
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setMessage(data?.error || "Unable to export roster.");
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${props.teamName}-roster.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="ira-card p-6 space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-ira-navy">{props.teamName}</h1>
        <p className="text-sm text-slate-600">Select which product sizes team members can edit.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {PRODUCT_OPTIONS.map((product) => (
          <label key={product.key} className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={selected.includes(product.key)}
              onChange={() => toggleProduct(product.key)}
              disabled={saving}
            />
            {product.label}
          </label>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={saveProducts}
          className="ira-button-primary"
          disabled={saving || exporting}
        >
          {saving ? "Saving..." : "Save Products"}
        </button>
        <button
          type="button"
          onClick={exportRoster}
          className="ira-button-secondary"
          disabled={saving || exporting}
        >
          {exporting ? "Exporting..." : "Export Excel"}
        </button>
        <button
          type="button"
          onClick={copyShareMessage}
          className="ira-button-secondary"
          disabled={saving || exporting}
        >
          {copied ? "Copied" : "Share Update Link"}
        </button>
      </div>

      <div className="rounded-md border border-ira-navy/20 bg-blue-50 px-3 py-2 text-sm text-ira-navy">
        <p className="font-semibold">Next Step</p>
        <p className="mt-1">
          After configuring products, click <span className="font-semibold">Share Update Link</span> and send it to the team manager/coordinator so team members can update the roster.
        </p>
      </div>

      {message && (
        <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800">
          {message}
        </div>
      )}
    </div>
  );
}
