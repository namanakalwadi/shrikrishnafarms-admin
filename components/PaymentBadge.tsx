"use client";

import { useState, useRef, useEffect } from "react";

export default function PaymentBadge({
  orderId,
  mode,
  paymentStatus: initialStatus,
  utr,
  screenshotUrl,
  verified: initialVerified,
  confirmationId,
}: {
  orderId: string;
  mode: string;
  paymentStatus: string;
  utr?: string | null;
  screenshotUrl?: string | null;
  verified?: boolean;
  confirmationId?: string | null;
}) {
  const [paymentStatus, setPaymentStatus] = useState(initialStatus || "pending");
  const [verified, setVerified] = useState(initialVerified ?? false);
  const [open, setOpen] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const updatePaymentStatus = async (val: string) => {
    if (val === paymentStatus) return;
    const prev = paymentStatus;
    setPaymentStatus(val);
    try {
      const res = await fetch(`/api/orders/${orderId}/payment-status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payment_status: val }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setPaymentStatus(prev);
    }
  };

  const toggleVerify = async () => {
    if (!confirmationId) return;
    const newVal = !verified;
    if (!newVal && !window.confirm("Reject this payment?")) return;
    setVerified(newVal);
    setVerifyLoading(true);
    try {
      const res = await fetch(`/api/payments/${confirmationId}/verify`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verified: newVal }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setVerified(!newVal);
    } finally {
      setVerifyLoading(false);
    }
  };

  const statusColor = paymentStatus === "paid"
    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
    : "bg-amber-50 text-amber-700 border-amber-200";

  const label = mode === "cod" ? "COD" : "Online";

  if (mode === "cod") {
    return (
      <select
        value={paymentStatus}
        onChange={(e) => updatePaymentStatus(e.target.value)}
        className={`text-xs font-medium px-2 py-0.5 rounded-md border cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 ${statusColor}`}
      >
        <option value="pending">{label} - Pending</option>
        <option value="paid">{label} - Paid</option>
      </select>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <div className="flex items-center gap-1">
        <select
          value={paymentStatus}
          onChange={(e) => updatePaymentStatus(e.target.value)}
          className={`text-xs font-medium px-2 py-0.5 rounded-md border cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 ${statusColor}`}
        >
          <option value="pending">{label} - Pending</option>
          <option value="paid">{label} - Paid</option>
        </select>
        <button
          onClick={() => setOpen(!open)}
          className="text-xs text-slate-400 hover:text-slate-600 px-1 transition-colors"
          title="Payment details"
        >
          {open ? "\u00D7" : "\u2026"}
        </button>
      </div>
      {open && (
        <div className="absolute z-30 top-full mt-1 right-0 bg-white border border-slate-200 rounded-lg shadow-lg p-3 w-52">
          {utr ? (
            <div className="space-y-2.5">
              <div>
                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">UTR</p>
                <p className="font-mono text-slate-900 text-xs">{utr}</p>
              </div>
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${verified ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
                  {verified ? "Verified" : "Unverified"}
                </span>
                {screenshotUrl && (
                  <a href={screenshotUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-[10px] font-medium hover:text-blue-700">
                    Screenshot
                  </a>
                )}
              </div>
              {confirmationId && (
                <button
                  onClick={toggleVerify}
                  disabled={verifyLoading}
                  className={`w-full text-xs font-medium py-1.5 rounded-md border transition-colors ${
                    verified
                      ? "bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
                      : "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100"
                  } ${verifyLoading ? "opacity-50" : ""}`}
                >
                  {verifyLoading ? "..." : verified ? "Reject" : "Verify"}
                </button>
              )}
            </div>
          ) : (
            <p className="text-xs text-slate-400">No payment confirmation yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
