import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { clearActiveProfileCookie } from "@/lib/auth/profiles";

export async function POST(request: Request) {
  const supabase = createClient();
  await clearActiveProfileCookie();
  await supabase.auth.signOut();
  const url = new URL("/", request.url);
  return NextResponse.redirect(url, { status: 303 });
}
