import { createServiceClient } from "@/lib/supabase-server";
import { requireAuth, errorResponse } from "@/lib/api-auth";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(req: NextRequest) {
  const authError = await requireAuth(req);
  if (authError) return authError;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errorResponse(400);
  }

  const { mango_id, in_stock } = body as { mango_id: number; in_stock: boolean };
  if (typeof mango_id !== "number" || typeof in_stock !== "boolean") return errorResponse(400);
  if (!Number.isInteger(mango_id) || mango_id < 1 || mango_id > 100) return errorResponse(400);

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("inventory")
    .upsert({ mango_id, in_stock }, { onConflict: "mango_id" });

  if (error) {
    console.error("Inventory upsert error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
