import { createServiceClient } from "@/lib/supabase-server";
import Link from "next/link";
import InlineStatus from "@/components/InlineStatus";
import PaymentBadge from "@/components/PaymentBadge";

const STATUS_OPTIONS = ["all", "pending", "confirmed", "delivered", "cancelled", "deleted"];
const PAGE_SIZE = 25;

type PaymentConfRow = { id: string; utr_number: string; screenshot_url: string; verified: boolean };

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; page?: string }>;
}) {
  const { status, q, page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10));
  const start = (page - 1) * PAGE_SIZE;
  const end = start + PAGE_SIZE - 1;

  const supabase = createServiceClient();

  let query = supabase
    .from("orders")
    .select("id, created_at, customer_name, mobile, district, total_amount, payment_mode, payment_status, status, deleted_at, order_items(mango_name), payment_confirmations(id, utr_number, screenshot_url, verified)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(start, end);

  if (status === "deleted") {
    query = query.not("deleted_at", "is", null);
  } else {
    query = query.is("deleted_at", null);
    if (status && status !== "all" && ["pending", "confirmed", "delivered", "cancelled"].includes(status)) {
      query = query.eq("status", status);
    }
  }
  if (q) {
    // Escape SQL LIKE wildcards and limit length
    const sanitized = q.slice(0, 100).replace(/[%_\\]/g, "\\$&");
    query = query.or(`customer_name.ilike.%${sanitized}%,mobile.ilike.%${sanitized}%`);
  }

  const { data: orders, count } = await query;
  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE);

  const buildHref = (p: number) => {
    const params = new URLSearchParams();
    if (status && status !== "all") params.set("status", status);
    if (q) params.set("q", q);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return `/orders${qs ? `?${qs}` : ""}`;
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Orders</h1>
          <p className="text-slate-500 text-sm">{count ?? 0} orders found</p>
        </div>
        <Link href="/orders/new"
          className="bg-slate-900 hover:bg-slate-800 text-white px-3 py-2 rounded-md text-xs font-medium transition-colors">
          + New Order
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        {STATUS_OPTIONS.map((s) => (
          <Link
            key={s}
            href={`/orders?status=${s}${q ? `&q=${q}` : ""}`}
            className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors ${
              (s === "all" && !status) || status === s
                ? "bg-slate-900 text-white"
                : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300"
            }`}
          >
            {s}
          </Link>
        ))}
        <form method="GET" action="/orders" className="w-full md:w-auto md:ml-auto flex gap-2 mt-2 md:mt-0">
          {status && <input type="hidden" name="status" value={status} />}
          <input
            name="q"
            defaultValue={q}
            placeholder="Search name or mobile..."
            className="border border-slate-200 rounded-md px-3 py-1.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent flex-1 md:w-52 placeholder:text-slate-400"
          />
          <button type="submit" className="bg-slate-900 text-white px-3 py-1.5 rounded-md text-xs font-medium hover:bg-slate-800 transition-colors">
            Search
          </button>
        </form>
      </div>

      {/* Mobile: stacked cards */}
      <div className="md:hidden space-y-3">
        {orders?.map((order) => {
          const pc = (order.payment_confirmations as PaymentConfRow[] | null)?.[0];
          const items = (order.order_items as { mango_name: string }[] | null)?.map((i) => i.mango_name).join(", ");
          return (
            <div key={order.id} className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link href={`/orders/${order.id}`} className="font-semibold text-slate-900 hover:text-blue-600 text-sm">{order.customer_name}</Link>
                  <p className="text-slate-400 text-xs mt-0.5">{order.mobile} · {order.district}</p>
                  <p className="text-slate-400 text-xs font-mono mt-0.5">
                    {new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
                <span className="font-semibold text-slate-900 text-sm whitespace-nowrap">₹{order.total_amount}</span>
              </div>

              {items && <p className="text-slate-500 text-xs">{items}</p>}

              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                <PaymentBadge orderId={order.id} mode={order.payment_mode} paymentStatus={order.payment_status ?? "pending"} utr={pc?.utr_number} screenshotUrl={pc?.screenshot_url} verified={pc?.verified} confirmationId={pc?.id} />
                <InlineStatus orderId={order.id} status={order.status} />
              </div>
            </div>
          );
        })}
        {(!orders || orders.length === 0) && (
          <div className="bg-white border border-slate-200 rounded-lg px-4 py-12 text-center text-slate-400 text-sm">No orders found.</div>
        )}
      </div>

      {/* Desktop: table */}
      <div className="hidden md:block bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Date</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Customer</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">District</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500 hidden lg:table-cell">Items</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Total</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Payment</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders?.map((order) => {
                const pc = (order.payment_confirmations as PaymentConfRow[] | null)?.[0];
                return (
                  <tr key={order.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-2.5 text-slate-500 font-mono text-xs whitespace-nowrap">
                      {new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-4 py-2.5">
                      <Link href={`/orders/${order.id}`} className="font-medium text-slate-900 hover:text-blue-600">{order.customer_name}</Link>
                      <p className="text-slate-400 text-xs">{order.mobile}</p>
                    </td>
                    <td className="px-4 py-2.5 text-slate-600">{order.district}</td>
                    <td className="px-4 py-2.5 text-slate-500 text-xs max-w-[160px] hidden lg:table-cell">
                      {(order.order_items as { mango_name: string }[] | null)?.map((i) => i.mango_name).join(", ")}
                    </td>
                    <td className="px-4 py-2.5 font-medium text-slate-900 whitespace-nowrap">{order.total_amount}</td>
                    <td className="px-4 py-2.5">
                      <PaymentBadge orderId={order.id} mode={order.payment_mode} paymentStatus={order.payment_status ?? "pending"} utr={pc?.utr_number} screenshotUrl={pc?.screenshot_url} verified={pc?.verified} confirmationId={pc?.id} />
                    </td>
                    <td className="px-4 py-2.5">
                      <InlineStatus orderId={order.id} status={order.status} />
                    </td>
                  </tr>
                );
              })}
              {(!orders || orders.length === 0) && (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-400">No orders found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 mt-3 bg-white border border-slate-200 rounded-lg">
          <p className="text-xs text-slate-500">
            Page {page} of {totalPages} ({count} total)
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={buildHref(page - 1)} className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-md hover:bg-slate-50 transition-colors text-slate-700">
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link href={buildHref(page + 1)} className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-md hover:bg-slate-50 transition-colors text-slate-700">
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
