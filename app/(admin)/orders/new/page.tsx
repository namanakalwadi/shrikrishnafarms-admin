import Link from "next/link";
import OrderForm from "@/components/OrderForm";

export default function NewOrderPage() {
  return (
    <div className="p-4 md:p-6 max-w-4xl">
      <div className="mb-5">
        <Link href="/orders" className="text-blue-600 text-sm font-medium hover:text-blue-700">Back to Orders</Link>
        <h1 className="text-lg font-semibold text-slate-900 mt-1">New Order</h1>
        <p className="text-slate-500 text-sm">Create a custom order with any variety and price.</p>
      </div>
      <OrderForm mode="create" />
    </div>
  );
}
