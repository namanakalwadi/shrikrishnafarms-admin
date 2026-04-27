import { createServiceClient } from "@/lib/supabase-server";
import { requireAuth, isValidUUID, errorResponse } from "@/lib/api-auth";
import { NextRequest, NextResponse } from "next/server";

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

  const { payment_status } = body as { payment_status: string };
  if (!["paid", "pending"].includes(payment_status)) return errorResponse(400);

  const supabase = createServiceClient();
  const { error } = await supabase.from("orders").update({ payment_status }).eq("id", id);

  if (error) return errorResponse(500);
  return NextResponse.json({ success: true });
}
