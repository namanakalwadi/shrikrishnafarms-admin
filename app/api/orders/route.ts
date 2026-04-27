import { createServiceClient } from "@/lib/supabase-server";
import { requireAuth, errorResponse } from "@/lib/api-auth";
import { NextRequest, NextResponse } from "next/server";
import { validateOrderPayload } from "./payload";

export async function POST(req: NextRequest) {
  const authError = await requireAuth(req);
  if (authError) return authError;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errorResponse(400);
  }

  const parsed = validateOrderPayload(body);
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const { header, items } = parsed;

  const supabase = createServiceClient();
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert([header])
    .select("id")
    .single();

  if (orderError || !order) {
    console.error("Order insert error:", orderError);
    return NextResponse.json({ error: orderError?.message ?? "Failed to insert order." }, { status: 500 });
  }

  const { error: itemsError } = await supabase
    .from("order_items")
    .insert(items.map((i) => ({ order_id: order.id, ...i })));

  if (itemsError) {
    console.error("Items insert error:", itemsError);
    await supabase.from("orders").delete().eq("id", order.id);
    return NextResponse.json({ error: itemsError.message }, { status: 500 });
  }

  return NextResponse.json({ orderId: order.id }, { status: 201 });
}
