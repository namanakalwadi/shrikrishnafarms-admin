import { createServiceClient } from "@/lib/supabase-server";
import { requireAuth, isValidUUID, errorResponse } from "@/lib/api-auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAuth(req);
  if (authError) return authError;

  const { id } = await params;
  if (!isValidUUID(id)) return errorResponse(400);

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("orders")
    .update({ deleted_at: null })
    .eq("id", id);

  if (error) {
    console.error("Order restore error:", error);
    return errorResponse(500);
  }
  return NextResponse.json({ success: true });
}
