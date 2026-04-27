"use client";

import { useState } from "react";

const STATUS_OPTIONS = ["pending", "confirmed", "delivered", "cancelled"];

const statusColors: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  confirmed: "bg-blue-50 text-blue-700 border-blue-200",
  delivered: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
};

export default function StatusUpdater({ orderId, currentStatus }: { orderId: string; currentStatus: string }) {
  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const handleUpdate = async () => {
    if (status === currentStatus) return;
    if (status === "cancelled" && !window.confirm("Cancel this order? This action cannot be undone.")) {
      setStatus(currentStatus);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update status");
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status");
      setStatus(currentStatus);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5">
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">Order Status</p>
      <div className="flex items-center gap-2">
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setError(""); }}
          className="flex-1 border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
        <button
          onClick={handleUpdate}
          disabled={loading || status === currentStatus}
          className="bg-slate-900 hover:bg-slate-800 disabled:bg-slate-100 disabled:text-slate-400 text-white font-medium px-4 py-2 rounded-md text-sm transition-colors"
        >
          {loading ? "Saving..." : saved ? "Saved" : "Update"}
        </button>
      </div>
      {error && (
        <p className="text-red-600 text-xs mt-2 bg-red-50 px-3 py-2 rounded-md">{error}</p>
      )}
      <div className="mt-3">
        <span className={`text-xs font-medium px-2 py-1 rounded-md border capitalize ${statusColors[status] ?? "bg-slate-50 text-slate-600 border-slate-200"}`}>
          {status}
        </span>
      </div>
    </div>
  );
}
