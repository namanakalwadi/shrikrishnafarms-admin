"use client";

import { useState } from "react";

export default function VerifyButton({ id, verified: initial }: { id: string; verified: boolean }) {
  const [verified, setVerified] = useState(initial);
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    const newVal = !verified;
    if (!newVal && !window.confirm("Reject this payment?")) return;
    setVerified(newVal);
    setLoading(true);
    try {
      const res = await fetch(`/api/payments/${id}/verify`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verified: newVal }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setVerified(!newVal);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`text-xs font-medium px-2.5 py-1 rounded-md transition-colors ${
        verified
          ? "text-red-600 hover:bg-red-50 border border-red-200"
          : "text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200"
      } ${loading ? "opacity-50" : ""}`}
    >
      {loading ? "..." : verified ? "Reject" : "Verify"}
    </button>
  );
}
