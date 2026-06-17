import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { ACTIVE_PROFILE_COOKIE } from "@/lib/auth/profile-session";
import { destinationForProfile } from "@/lib/auth/profile-session";

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

  const isPublicRoute =
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/setup") ||
    pathname.startsWith("/auth/select-profile");

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

  if (user && isProtectedRoute) {
    const activeProfileId = request.cookies.get(ACTIVE_PROFILE_COOKIE)?.value;

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, role, onboarded_at, agent_application_status")
      .eq("user_id", user.id);

    let rows = profiles ?? [];
    if (rows.length === 0) {
      const { data: legacy } = await supabase
        .from("profiles")
        .select("id, role, onboarded_at, agent_application_status")
        .eq("id", user.id)
        .maybeSingle();
      rows = legacy ? [legacy] : [];
    }

    if (rows.length > 1 && !activeProfileId) {
      const url = request.nextUrl.clone();
      url.pathname = "/auth/select-profile";
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }

    const active =
      rows.find((row) => row.id === activeProfileId) ?? (rows.length === 1 ? rows[0] : null);

    if (!active) {
      const url = request.nextUrl.clone();
      url.pathname = "/auth/select-profile";
      return NextResponse.redirect(url);
    }

    const expectedPrefix = `/${active.role}`;
    if (
      !pathname.startsWith(expectedPrefix) &&
      !(active.role === "admin" && (pathname.startsWith("/driver") || pathname.startsWith("/agent")))
    ) {
      const url = request.nextUrl.clone();
      url.pathname = destinationForProfile(active);
      return NextResponse.redirect(url);
    }

    if (
      active.role === "driver" &&
      active.agent_application_status === "pending" &&
      !pathname.startsWith("/register/agent/pending")
    ) {
      const url = request.nextUrl.clone();
      url.pathname = "/register/agent/pending";
      return NextResponse.redirect(url);
    }
  }

  if (user && isAuthRoute) {
    const activeProfileId = request.cookies.get(ACTIVE_PROFILE_COOKIE)?.value;
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, role, onboarded_at, agent_application_status")
      .eq("user_id", user.id);

    let rows = profiles ?? [];
    if (rows.length === 0) {
      const { data: legacy } = await supabase
        .from("profiles")
        .select("id, role, onboarded_at, agent_application_status")
        .eq("id", user.id)
        .maybeSingle();
      rows = legacy ? [legacy] : [];
    }

    if (rows.length > 1 && !activeProfileId) {
      const url = request.nextUrl.clone();
      url.pathname = "/auth/select-profile";
      return NextResponse.redirect(url);
    }

    const active =
      rows.find((row) => row.id === activeProfileId) ?? (rows.length === 1 ? rows[0] : null);

    if (active) {
      if (
        active.role === "driver" &&
        active.agent_application_status === "pending"
      ) {
        const url = request.nextUrl.clone();
        url.pathname = "/register/agent/pending";
        return NextResponse.redirect(url);
      }

      const url = request.nextUrl.clone();
      url.pathname = destinationForProfile(active);
      return NextResponse.redirect(url);
    }
  }

  return response;
}
