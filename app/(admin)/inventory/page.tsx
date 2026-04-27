import { createServiceClient } from "@/lib/supabase-server";
import mangoes from "@/data/mangoes.json";
import InventoryToggle from "./InventoryToggle";

export default async function InventoryPage() {
  const supabase = createServiceClient();
  const { data: inventory } = await supabase.from("inventory").select("mango_id, in_stock");

  const stockMap: Record<number, boolean> = {};
  inventory?.forEach((i) => { stockMap[i.mango_id] = i.in_stock; });

  return (
    <div className="p-4 md:p-6 max-w-2xl">
      <div className="mb-5">
        <h1 className="text-lg font-semibold text-slate-900">Inventory</h1>
        <p className="text-slate-500 text-sm">Toggle stock status. Changes reflect on the customer site immediately.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        {mangoes.map((mango, idx) => {
          const inStock = stockMap[mango.id] ?? true;
          return (
            <div
              key={mango.id}
              className={`flex items-center justify-between px-5 py-4 ${idx < mangoes.length - 1 ? "border-b border-slate-100" : ""}`}
            >
              <div>
                <p className="font-medium text-slate-900">{mango.name}</p>
                <p className="text-slate-400 text-xs mt-0.5">₹{mango.price} {mango.priceUnit}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-md border ${inStock ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-600 border-red-200"}`}>
                  {inStock ? "In Stock" : "Out of Stock"}
                </span>
                <InventoryToggle mangoId={mango.id} inStock={inStock} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
