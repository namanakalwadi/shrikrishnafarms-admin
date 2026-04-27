"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type BoxType = "dozen" | "5kg";

export interface OrderFormItem {
  mango_id: number;
  mango_name: string;
  quantity_dozens: number;
  price_per_dozen: number;
  box_type: BoxType;
  size: string | null;
}

export interface OrderFormValues {
  customer_name: string;
  mobile: string;
  address: string;
  district: string;
  delivery_charge: number;
  payment_mode: "cod" | "online";
  payment_status: "pending" | "paid";
  status: "pending" | "confirmed" | "delivered" | "cancelled";
  items: OrderFormItem[];
}

const MANGO_PRESETS = [
  { id: 3, name: "Alphonso (Hapus)" },
  { id: 2, name: "Kesar" },
  { id: 0, name: "Custom" },
];

const emptyItem = (): OrderFormItem => ({
  mango_id: 3,
  mango_name: "Alphonso (Hapus)",
  quantity_dozens: 1,
  price_per_dozen: 0,
  box_type: "dozen",
  size: null,
});

export default function OrderForm({
  initial,
  mode,
  orderId,
}: {
  initial?: OrderFormValues;
  mode: "create" | "edit";
  orderId?: string;
}) {
  const router = useRouter();
  const [values, setValues] = useState<OrderFormValues>(
    initial ?? {
      customer_name: "",
      mobile: "",
      address: "",
      district: "Dharwad",
      delivery_charge: 0,
      payment_mode: "cod",
      payment_status: "pending",
      status: "pending",
      items: [emptyItem()],
    }
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const subtotal = useMemo(
    () => values.items.reduce((s, i) => s + (Number(i.quantity_dozens) || 0) * (Number(i.price_per_dozen) || 0), 0),
    [values.items]
  );
  const total = subtotal + (Number(values.delivery_charge) || 0);

  const setField = <K extends keyof OrderFormValues>(k: K, v: OrderFormValues[K]) =>
    setValues((prev) => ({ ...prev, [k]: v }));

  const updateItem = (idx: number, patch: Partial<OrderFormItem>) =>
    setValues((prev) => {
      const next = [...prev.items];
      next[idx] = { ...next[idx], ...patch };
      return { ...prev, items: next };
    });

  const addItem = () => setValues((prev) => ({ ...prev, items: [...prev.items, emptyItem()] }));

  const removeItem = (idx: number) =>
    setValues((prev) => ({ ...prev, items: prev.items.filter((_, i) => i !== idx) }));

  const handlePreset = (idx: number, id: number) => {
    const preset = MANGO_PRESETS.find((p) => p.id === id);
    if (!preset) return;
    updateItem(idx, { mango_id: id, mango_name: id === 0 ? "" : preset.name });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!values.customer_name.trim() || !values.mobile.trim() || !values.address.trim() || !values.district.trim()) {
      setError("Customer name, mobile, address, and district are required.");
      return;
    }
    if (!/^\d{10}$/.test(values.mobile.trim())) {
      setError("Mobile must be a 10-digit number.");
      return;
    }
    if (values.items.length === 0) {
      setError("Add at least one item.");
      return;
    }
    for (const item of values.items) {
      if (!item.mango_name.trim()) {
        setError("Each item needs a variety name.");
        return;
      }
      if (!(item.quantity_dozens > 0) || !(item.price_per_dozen >= 0)) {
        setError("Item quantity and price must be valid numbers.");
        return;
      }
    }

    setSubmitting(true);
    try {
      const url = mode === "create" ? "/api/orders" : `/api/orders/${orderId}`;
      const method = mode === "create" ? "POST" : "PATCH";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Failed to save order.");

      const id = mode === "create" ? data.orderId : orderId;
      router.push(`/orders/${id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save order.");
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Customer */}
      <section className="bg-white border border-slate-200 rounded-lg p-5">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">Customer</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Name">
            <input className={inputCls} value={values.customer_name}
              onChange={(e) => setField("customer_name", e.target.value)} maxLength={100} required />
          </Field>
          <Field label="Mobile (10 digits)">
            <input className={inputCls} value={values.mobile}
              onChange={(e) => setField("mobile", e.target.value.replace(/\D/g, "").slice(0, 10))} required />
          </Field>
          <Field label="Address" className="md:col-span-2">
            <textarea className={inputCls} rows={2} value={values.address}
              onChange={(e) => setField("address", e.target.value)} maxLength={500} required />
          </Field>
          <Field label="District" className="md:col-span-2">
            <input className={inputCls} value={values.district}
              onChange={(e) => setField("district", e.target.value)} maxLength={60} required />
          </Field>
        </div>
      </section>

      {/* Items */}
      <section className="bg-white border border-slate-200 rounded-lg p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Items</p>
          <button type="button" onClick={addItem}
            className="text-xs font-medium text-blue-600 hover:text-blue-700">+ Add item</button>
        </div>
        <div className="space-y-3">
          {values.items.map((item, idx) => (
            <div key={idx} className="border border-slate-100 rounded-md p-3 bg-slate-50/50">
              <div className="grid grid-cols-2 md:grid-cols-12 gap-2">
                <Field label="Preset" className="md:col-span-2">
                  <select className={inputCls} value={item.mango_id}
                    onChange={(e) => handlePreset(idx, Number(e.target.value))}>
                    {MANGO_PRESETS.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Variety" className="md:col-span-3">
                  <input className={inputCls} value={item.mango_name}
                    onChange={(e) => updateItem(idx, { mango_name: e.target.value })}
                    maxLength={100} required />
                </Field>
                <Field label="Box type" className="md:col-span-2">
                  <select className={inputCls} value={item.box_type}
                    onChange={(e) => updateItem(idx, { box_type: e.target.value as BoxType, size: e.target.value === "5kg" ? item.size ?? "medium" : null })}>
                    <option value="dozen">Dozen</option>
                    <option value="5kg">5 Kg Box</option>
                  </select>
                </Field>
                <Field label="Size" className="md:col-span-1">
                  <input className={inputCls} value={item.size ?? ""} disabled={item.box_type !== "5kg"}
                    onChange={(e) => updateItem(idx, { size: e.target.value || null })} maxLength={20} />
                </Field>
                <Field label="Qty" className="md:col-span-1">
                  <input type="number" min="0" step="1" className={inputCls} value={item.quantity_dozens}
                    onChange={(e) => updateItem(idx, { quantity_dozens: Number(e.target.value) })} required />
                </Field>
                <Field label="Price" className="md:col-span-2">
                  <input type="number" min="0" step="1" className={inputCls} value={item.price_per_dozen}
                    onChange={(e) => updateItem(idx, { price_per_dozen: Number(e.target.value) })} required />
                </Field>
                <div className="md:col-span-1 flex items-end">
                  <button type="button" onClick={() => removeItem(idx)}
                    disabled={values.items.length === 1}
                    className="text-xs font-medium text-red-600 hover:text-red-700 disabled:text-slate-300 disabled:cursor-not-allowed px-2 py-2">
                    Remove
                  </button>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-2 text-right">
                Subtotal: <span className="font-medium text-slate-900">₹{(item.quantity_dozens * item.price_per_dozen).toLocaleString("en-IN")}</span>
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Totals + Meta */}
      <section className="bg-white border border-slate-200 rounded-lg p-5">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">Payment & Status</p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Field label="Delivery charge">
            <input type="number" min="0" step="1" className={inputCls} value={values.delivery_charge}
              onChange={(e) => setField("delivery_charge", Number(e.target.value))} />
          </Field>
          <Field label="Payment mode">
            <select className={inputCls} value={values.payment_mode}
              onChange={(e) => setField("payment_mode", e.target.value as "cod" | "online")}>
              <option value="cod">Cash on Delivery</option>
              <option value="online">Online</option>
            </select>
          </Field>
          <Field label="Payment status">
            <select className={inputCls} value={values.payment_status}
              onChange={(e) => setField("payment_status", e.target.value as "pending" | "paid")}>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
            </select>
          </Field>
          <Field label="Order status">
            <select className={inputCls} value={values.status}
              onChange={(e) => setField("status", e.target.value as OrderFormValues["status"])}>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </Field>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-sm">
          <span className="text-slate-500">Subtotal</span>
          <span className="font-medium text-slate-900">₹{subtotal.toLocaleString("en-IN")}</span>
        </div>
        <div className="flex items-center justify-between text-sm mt-1">
          <span className="text-slate-500">Delivery</span>
          <span className="font-medium text-slate-900">₹{(Number(values.delivery_charge) || 0).toLocaleString("en-IN")}</span>
        </div>
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
          <span className="font-semibold text-slate-900">Total</span>
          <span className="font-semibold text-slate-900 text-base">₹{total.toLocaleString("en-IN")}</span>
        </div>
      </section>

      {error && <p className="text-red-600 text-sm bg-red-50 border border-red-200 px-3 py-2 rounded-md">{error}</p>}

      <div className="flex gap-2">
        <button type="submit" disabled={submitting}
          className="bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-medium px-5 py-2 rounded-md text-sm transition-colors">
          {submitting ? "Saving..." : mode === "create" ? "Create order" : "Save changes"}
        </button>
        <button type="button" onClick={() => router.back()}
          className="bg-white border border-slate-200 text-slate-700 font-medium px-5 py-2 rounded-md text-sm hover:bg-slate-50 transition-colors">
          Cancel
        </button>
      </div>
    </form>
  );
}

const inputCls =
  "w-full border border-slate-200 rounded-md px-3 py-1.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-400";

function Field({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={`block ${className ?? ""}`}>
      <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wide block mb-1">{label}</span>
      {children}
    </label>
  );
}
