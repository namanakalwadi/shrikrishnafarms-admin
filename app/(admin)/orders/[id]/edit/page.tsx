import { createServiceClient } from "@/lib/supabase-server";
import { notFound } from "next/navigation";
import Link from "next/link";
import OrderForm, { type OrderFormValues, type OrderFormItem } from "@/components/OrderForm";

type DbOrderItem = {
  mango_id: number;
  mango_name: string;
  quantity_dozens: number;
  price_per_dozen: number;
  box_type: string | null;
  size: string | null;
};

export default async function EditOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createServiceClient();

  const { data: order } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("id", id)
    .maybeSingle();

  if (!order) notFound();

  const items: OrderFormItem[] = (order.order_items as DbOrderItem[] | null ?? []).map((i) => ({
    mango_id: i.mango_id,
    mango_name: i.mango_name,
    quantity_dozens: Number(i.quantity_dozens),
    price_per_dozen: Number(i.price_per_dozen),
    box_type: i.box_type === "5kg" ? "5kg" : "dozen",
    size: i.size,
  }));

  const initial: OrderFormValues = {
    customer_name: order.customer_name ?? "",
    mobile: order.mobile ?? "",
    address: order.address ?? "",
    district: order.district ?? "",
    delivery_charge: Number(order.delivery_charge) || 0,
    payment_mode: order.payment_mode === "online" ? "online" : "cod",
    payment_status: order.payment_status === "paid" ? "paid" : "pending",
    status: order.status ?? "pending",
    items: items.length > 0 ? items : [],
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl">
      <div className="mb-5">
        <Link href={`/orders/${id}`} className="text-blue-600 text-sm font-medium hover:text-blue-700">Back to Order</Link>
        <h1 className="text-lg font-semibold text-slate-900 mt-1">Edit Order</h1>
        <p className="text-slate-400 text-xs font-mono mt-0.5">#{id.slice(0, 8).toUpperCase()}</p>
      </div>
      <OrderForm mode="edit" orderId={id} initial={initial} />
    </div>
  );
}
