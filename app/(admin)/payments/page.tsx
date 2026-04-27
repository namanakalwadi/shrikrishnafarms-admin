import { createServiceClient } from "@/lib/supabase-server";
import Link from "next/link";
import VerifyButton from "./VerifyButton";

const PAGE_SIZE = 25;

type PaymentConf = {
  id: string;
  utr_number: string;
  screenshot_url: string;
  verified: boolean;
  created_at: string;
};

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10));
  const start = (page - 1) * PAGE_SIZE;
  const end = start + PAGE_SIZE - 1;

  const supabase = createServiceClient();

  const { data: orders, count } = await supabase
    .from("orders")
    .select("id, created_at, customer_name, mobile, total_amount, district, payment_status, payment_confirmations(id, utr_number, screenshot_url, verified, created_at)", { count: "exact" })
    .eq("payment_mode", "online")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .range(start, end);

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE);

  return (
    <div className="p-4 md:p-6 max-w-6xl">
      <div className="mb-5">
        <h1 className="text-lg font-semibold text-slate-900">Online Payments</h1>
        <p className="text-slate-500 text-sm">{count ?? 0} online orders</p>
      </div>

      {/* Mobile: stacked cards */}
      <div className="md:hidden space-y-3">
        {orders?.map((o) => {
          const conf = (o.payment_confirmations as PaymentConf[] | null)?.[0];
          const status = conf
            ? conf.verified ? "verified" : "awaiting-verify"
            : "awaiting-payment";
          return (
            <div key={o.id} className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link href={`/orders/${o.id}`} className="font-semibold text-slate-900 hover:text-blue-600 text-sm">{o.customer_name}</Link>
                  <p className="text-slate-400 text-xs mt-0.5">{o.mobile} · {o.district}</p>
                  <p className="text-slate-400 text-xs font-mono mt-0.5">
                    {new Date(o.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
                <span className="font-semibold text-slate-900 text-sm whitespace-nowrap">₹{o.total_amount}</span>
              </div>

              {conf && (
                <div className="text-xs space-y-1">
                  <p className="text-slate-500">UTR: <span className="font-mono text-slate-700">{conf.utr_number}</span></p>
                  <a href={conf.screenshot_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 font-medium hover:text-blue-700">View screenshot →</a>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                {status === "verified" && (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-md border bg-emerald-50 text-emerald-700 border-emerald-200">Verified</span>
                )}
                {status === "awaiting-verify" && (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-md border bg-amber-50 text-amber-700 border-amber-200">Awaiting verify</span>
                )}
                {status === "awaiting-payment" && (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-md border bg-slate-50 text-slate-600 border-slate-200">Awaiting payment</span>
                )}
                {conf && <VerifyButton id={conf.id} verified={conf.verified} />}
              </div>
            </div>
          );
        })}
        {(!orders || orders.length === 0) && (
          <div className="bg-white border border-slate-200 rounded-lg px-4 py-12 text-center text-slate-400 text-sm">No online orders yet.</div>
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
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Amount</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">UTR Number</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Screenshot</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Status</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Action</th>
              </tr>
            </thead>
            <tbody>
              {orders?.map((o) => {
                const conf = (o.payment_confirmations as PaymentConf[] | null)?.[0];
                const status = conf
                  ? conf.verified ? "verified" : "awaiting-verify"
                  : "awaiting-payment";
                return (
                  <tr key={o.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-2.5 text-slate-500 font-mono text-xs whitespace-nowrap">
                      {new Date(o.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-4 py-2.5">
                      <Link href={`/orders/${o.id}`} className="font-medium text-slate-900 hover:text-blue-600">{o.customer_name}</Link>
                      <p className="text-slate-400 text-xs">{o.mobile}</p>
                    </td>
                    <td className="px-4 py-2.5 font-medium text-slate-900">{o.total_amount}</td>
                    <td className="px-4 py-2.5 font-mono text-slate-700 text-xs">{conf?.utr_number ?? "—"}</td>
                    <td className="px-4 py-2.5">
                      {conf?.screenshot_url ? (
                        <a href={conf.screenshot_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-xs font-medium hover:text-blue-700">
                          View
                        </a>
                      ) : (
                        <span className="text-slate-300 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      {status === "verified" && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-md border bg-emerald-50 text-emerald-700 border-emerald-200">Verified</span>
                      )}
                      {status === "awaiting-verify" && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-md border bg-amber-50 text-amber-700 border-amber-200">Awaiting verify</span>
                      )}
                      {status === "awaiting-payment" && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-md border bg-slate-50 text-slate-600 border-slate-200">Awaiting payment</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      {conf ? (
                        <VerifyButton id={conf.id} verified={conf.verified} />
                      ) : (
                        <span className="text-slate-300 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {(!orders || orders.length === 0) && (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-400">No online orders yet.</td></tr>
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
              <a href={`/payments?page=${page - 1}`} className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-md hover:bg-slate-50 transition-colors text-slate-700">
                Previous
              </a>
            )}
            {page < totalPages && (
              <a href={`/payments?page=${page + 1}`} className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-md hover:bg-slate-50 transition-colors text-slate-700">
                Next
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
