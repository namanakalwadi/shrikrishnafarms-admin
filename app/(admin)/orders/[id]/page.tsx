import { createServiceClient } from "@/lib/supabase-server";
import { notFound } from "next/navigation";
import Link from "next/link";
import StatusUpdater from "./StatusUpdater";
import PaymentBadge from "@/components/PaymentBadge";
import OrderActions from "@/components/OrderActions";

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createServiceClient();

  const [{ data: order }, { data: payment }] = await Promise.all([
    supabase.from("orders").select("*, order_items(*)").eq("id", id).single(),
    supabase.from("payment_confirmations").select("*").eq("order_id", id).maybeSingle(),
  ]);

  if (!order) notFound();
  const isDeleted = Boolean(order.deleted_at);

  return (
    <div className="p-4 md:p-6 max-w-4xl">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/orders" className="text-blue-600 text-sm font-medium hover:text-blue-700">Back to Orders</Link>
          <h1 className="text-lg font-semibold text-slate-900 mt-1">Order Detail</h1>
          <p className="text-slate-400 text-xs font-mono mt-0.5">#{order.id.slice(0, 8).toUpperCase()}</p>
        </div>
        <OrderActions orderId={order.id} isDeleted={isDeleted} />
      </div>

      {isDeleted && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          <span className="font-semibold">Deleted</span> on {new Date(order.deleted_at).toLocaleString("en-IN")}. This order is not active. You can restore it above.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Customer */}
        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">Customer</p>
          <p className="font-semibold text-slate-900">{order.customer_name}</p>
          <p className="text-slate-600 text-sm mt-1">{order.mobile}</p>
          <p className="text-slate-500 text-sm mt-2">{order.address}</p>
          {order.pincode && <p className="text-slate-500 text-sm">PIN: {order.pincode}</p>}
          <p className="text-slate-500 text-sm font-medium mt-1">{order.district}</p>
        </div>

        {/* Status + Payment */}
        <div className="space-y-4">
          <StatusUpdater orderId={order.id} currentStatus={order.status} />
          <div className="bg-white border border-slate-200 rounded-lg p-5">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">Payment</p>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 text-sm">Mode & Status</span>
                <PaymentBadge
                  orderId={order.id}
                  mode={order.payment_mode}
                  paymentStatus={order.payment_status ?? "pending"}
                  utr={payment?.utr_number}
                  screenshotUrl={payment?.screenshot_url}
                  verified={payment?.verified}
                  confirmationId={payment?.id}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 text-sm">Date</span>
                <span className="font-medium text-slate-900 text-sm">{new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden md:col-span-2">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide px-5 py-3 border-b border-slate-100">Items Ordered</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-5 py-2.5 text-xs font-medium text-slate-500">Variety</th>
                  <th className="text-right px-5 py-2.5 text-xs font-medium text-slate-500">Qty (doz)</th>
                  <th className="text-right px-5 py-2.5 text-xs font-medium text-slate-500">Rate</th>
                  <th className="text-right px-5 py-2.5 text-xs font-medium text-slate-500">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {order.order_items?.map((item: { id: string; mango_name: string; quantity_dozens: number; price_per_dozen: number; subtotal: number; box_type?: string; size?: string | null }) => (
                  <tr key={item.id} className="border-b border-slate-50">
                    <td className="px-5 py-2.5 font-medium text-slate-900">
                      {item.mango_name}
                      {item.box_type === "5kg" && <span className="text-xs text-slate-500 ml-1">(5Kg {item.size})</span>}
                    </td>
                    <td className="px-5 py-2.5 text-right text-slate-600">{item.quantity_dozens}</td>
                    <td className="px-5 py-2.5 text-right text-slate-600">{item.price_per_dozen}/{item.box_type === "5kg" ? "box" : "doz"}</td>
                    <td className="px-5 py-2.5 text-right font-medium text-slate-900">{item.subtotal}</td>
                  </tr>
                ))}
                <tr className="bg-slate-50">
                  <td colSpan={3} className="px-5 py-2.5 text-right text-sm text-slate-500">Delivery ({order.district})</td>
                  <td className="px-5 py-2.5 text-right text-slate-600">{order.delivery_charge === 0 ? "Free" : order.delivery_charge}</td>
                </tr>
                <tr className="bg-slate-50 border-t border-slate-200">
                  <td colSpan={3} className="px-5 py-2.5 text-right font-semibold text-slate-900">Total</td>
                  <td className="px-5 py-2.5 text-right font-semibold text-slate-900 text-base">{order.total_amount}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
