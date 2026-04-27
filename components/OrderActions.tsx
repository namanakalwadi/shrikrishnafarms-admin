"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function OrderActions({ orderId, isDeleted }: { orderId: string; isDeleted: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const softDelete = async () => {
    if (!window.confirm("Delete this order? It will be marked deleted but kept for records.")) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/orders/${orderId}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Failed to delete.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete.");
    } finally {
      setBusy(false);
    }
  };

  const restore = async () => {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/orders/${orderId}/restore`, { method: "POST" });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Failed to restore.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to restore.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {!isDeleted && (
        <Link href={`/orders/${orderId}/edit`}
          className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-3 py-1.5 rounded-md text-xs font-medium transition-colors">
          Edit
        </Link>
      )}
      {isDeleted ? (
        <button onClick={restore} disabled={busy}
          className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white px-3 py-1.5 rounded-md text-xs font-medium transition-colors">
          {busy ? "Restoring..." : "Restore"}
        </button>
      ) : (
        <button onClick={softDelete} disabled={busy}
          className="bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white px-3 py-1.5 rounded-md text-xs font-medium transition-colors">
          {busy ? "Deleting..." : "Delete"}
        </button>
      )}
      {error && <span className="text-red-600 text-xs">{error}</span>}
    </div>
  );
}
