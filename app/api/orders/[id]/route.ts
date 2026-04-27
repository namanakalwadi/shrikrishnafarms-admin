import { createServiceClient } from "@/lib/supabase-server";
import { requireAuth, isValidUUID, errorResponse } from "@/lib/api-auth";
import { NextRequest, NextResponse } from "next/server";
import { validateOrderPayload } from "../payload";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAuth(req);
  if (authError) return authError;

  const { id } = await params;
  if (!isValidUUID(id)) return errorResponse(400);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errorResponse(400);
  }

  const parsed = validateOrderPayload(body);
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const supabase = createServiceClient();

  const { data: existing, error: fetchErr } = await supabase
    .from("orders")
    .select("id")
    .eq("id", id)
    .maybeSingle();
  if (fetchErr || !existing) return errorResponse(404);

  const { error: updateErr } = await supabase
    .from("orders")
    .update(parsed.header)
    .eq("id", id);
  if (updateErr) {
    console.error("Order update error:", updateErr);
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  const { error: delErr } = await supabase.from("order_items").delete().eq("order_id", id);
  if (delErr) {
    console.error("Items delete error:", delErr);
    return NextResponse.json({ error: delErr.message }, { status: 500 });
  }

  const { error: insertErr } = await supabase
    .from("order_items")
    .insert(parsed.items.map((i) => ({ order_id: id, ...i })));
  if (insertErr) {
    console.error("Items insert error:", insertErr);
    return NextResponse.json({ error: insertErr.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAuth(req);
  if (authError) return authError;

  const { id } = await params;
  if (!isValidUUID(id)) return errorResponse(400);

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("orders")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    console.error("Order soft-delete error:", error);
    return errorResponse(500);
  }
  return NextResponse.json({ success: true });
}
