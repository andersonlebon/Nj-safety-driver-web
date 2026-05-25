import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: "", ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Explicit public routes — never bounce unauthenticated visitors away from
  // these. `/setup` is intentionally public because it is the one-time
  // first-admin bootstrap (which gates itself server-side).
  const isPublicRoute =
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/setup");

  const isAuthRoute =
    pathname.startsWith("/login") || pathname.startsWith("/register");

  const isProtectedRoute =
    pathname.startsWith("/driver") ||
    pathname.startsWith("/agent") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/onboarding");

  if (!user && isProtectedRoute && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  if (user && pathname.startsWith("/register/agent/pending")) {
    return response;
  }

  if (user && isAuthRoute) {
    const { data } = await supabase
      .from("profiles")
      .select("role, agent_application_status")
      .eq("id", user.id)
      .maybeSingle();

    const profile = data as {
      role?: string;
      agent_application_status?: string | null;
    } | null;

    if (
      profile?.role === "driver" &&
      profile.agent_application_status === "pending"
    ) {
      const url = request.nextUrl.clone();
      url.pathname = "/register/agent/pending";
      return NextResponse.redirect(url);
    }

    if (profile?.role) {
      const url = request.nextUrl.clone();
      url.pathname = `/${profile.role}`;
      return NextResponse.redirect(url);
    }
  }

  return response;
}
