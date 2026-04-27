"use client";

import { useState } from "react";

export default function InventoryToggle({ mangoId, inStock }: { mangoId: number; inStock: boolean }) {
  const [optimisticStock, setOptimisticStock] = useState(inStock);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const toggle = async () => {
    const newValue = !optimisticStock;
    setOptimisticStock(newValue);
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/inventory", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mango_id: mangoId, in_stock: newValue }),
      });
      if (!res.ok) throw new Error("Failed to update");
    } catch (err) {
      setOptimisticStock(!newValue);
      setError(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={toggle}
        disabled={loading}
        role="switch"
        aria-checked={optimisticStock}
        aria-label={optimisticStock ? "Mark out of stock" : "Mark in stock"}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
          loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
        } ${optimisticStock ? "bg-emerald-500" : "bg-slate-300"}`}
      >
        <span
          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
            optimisticStock ? "translate-x-[18px]" : "translate-x-[3px]"
          }`}
        />
      </button>
      {error && <span className="text-red-500 text-xs">{error}</span>}
    </div>
  );
}
