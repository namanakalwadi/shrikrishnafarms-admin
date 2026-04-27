import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Check auth session from request cookies. Returns null if authenticated, or a 401 response. */
export async function requireAuth(request: NextRequest): Promise<NextResponse | null> {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll() {},
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

/** Validate that a string is a valid UUID v4. */
export function isValidUUID(id: string): boolean {
  return UUID_REGEX.test(id);
}

/** Standard error response — never exposes internal details. */
export function errorResponse(status: number = 500) {
  const messages: Record<number, string> = {
    400: "Bad request",
    401: "Unauthorized",
    404: "Not found",
    500: "Internal server error",
  };
  return NextResponse.json({ error: messages[status] ?? "Error" }, { status });
}
