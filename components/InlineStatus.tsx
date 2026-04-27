"use client";

import { useState } from "react";

const OPTIONS = ["pending", "confirmed", "delivered", "cancelled"];
const colors: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  confirmed: "bg-blue-50 text-blue-700 border-blue-200",
  delivered: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
};

export default function InlineStatus({ orderId, status }: { orderId: string; status: string }) {
  const [current, setCurrent] = useState(status);
  const [loading, setLoading] = useState(false);

  const update = async (val: string) => {
    if (val === current) return;
    if (val === "cancelled" && !window.confirm("Cancel this order?")) return;
    const prev = current;
    setCurrent(val);
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: val }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setCurrent(prev);
    } finally {
      setLoading(false);
    }
  };

  return (
    <select
      value={current}
      onChange={(e) => update(e.target.value)}
      disabled={loading}
      className={`text-xs font-medium px-2 py-1 rounded-md border cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 capitalize ${colors[current] ?? "bg-slate-50 text-slate-600 border-slate-200"} ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      {OPTIONS.map((s) => (
        <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
      ))}
    </select>
  );
}
