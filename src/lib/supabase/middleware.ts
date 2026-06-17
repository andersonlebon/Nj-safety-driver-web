import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { ACTIVE_PROFILE_COOKIE } from "@/lib/auth/profile-session";
import { destinationForProfile } from "@/lib/auth/profile-session";
import { resolveRouteProfile, type RouteProfile } from "@/lib/auth/route-access";

async function listRouteProfiles(
  supabase: ReturnType<typeof createServerClient>,
  userId: string
): Promise<RouteProfile[]> {
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, role, onboarded_at, agent_application_status")
    .eq("user_id", userId);

  const rows = profiles ?? [];
  if (rows.length > 0) {
    return rows;
  }

  const { data: legacy } = await supabase
    .from("profiles")
    .select("id, role, onboarded_at, agent_application_status")
    .eq("id", userId)
    .maybeSingle();

  return legacy ? [legacy] : [];
}

function setActiveProfileCookie(response: NextResponse, profileId: string) {
  response.cookies.set(ACTIVE_PROFILE_COOKIE, profileId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

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
  const isPendingAgentRoute = pathname.startsWith("/register/agent/pending");

  if (!user && isProtectedRoute && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  const shouldResolveProfile = user && (isProtectedRoute || isAuthRoute || isPendingAgentRoute);
  let activeProfile: RouteProfile | null = null;

  if (shouldResolveProfile && user) {
    const activeProfileId = request.cookies.get(ACTIVE_PROFILE_COOKIE)?.value;
    const profiles = await listRouteProfiles(supabase, user.id);
    const resolved = resolveRouteProfile(profiles, activeProfileId);

    if (resolved.kind === "select") {
      const url = request.nextUrl.clone();
      url.pathname = "/auth/select-profile";
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }

    if (resolved.kind === "active") {
      activeProfile = resolved.profile;
      if (resolved.shouldSetCookie) {
        setActiveProfileCookie(response, resolved.profile.id);
      }
    }
  }

  if (user && isPendingAgentRoute) {
    if (!activeProfile) {
      return response;
    }

    if (activeProfile.role !== "driver") {
      const url = request.nextUrl.clone();
      url.pathname = destinationForProfile(activeProfile);
      return NextResponse.redirect(url);
    }

    if (activeProfile.agent_application_status === "pending") {
      return response;
    }

    if (activeProfile.agent_application_status === "rejected") {
      return response;
    }

    const url = request.nextUrl.clone();
    url.pathname = "/register/agent";
    return NextResponse.redirect(url);
  }

  if (user && isProtectedRoute && activeProfile) {
    const expectedPrefix = `/${activeProfile.role}`;
    if (
      !pathname.startsWith(expectedPrefix) &&
      !(
        activeProfile.role === "admin" &&
        (pathname.startsWith("/driver") || pathname.startsWith("/agent"))
      ) &&
      !(
        activeProfile.role === "driver" &&
        !activeProfile.onboarded_at &&
        pathname.startsWith("/onboarding")
      )
    ) {
      const url = request.nextUrl.clone();
      url.pathname = destinationForProfile(activeProfile);
      return NextResponse.redirect(url);
    }

    if (
      activeProfile.role === "driver" &&
      activeProfile.agent_application_status === "pending" &&
      !pathname.startsWith("/register/agent/pending")
    ) {
      const url = request.nextUrl.clone();
      url.pathname = "/register/agent/pending";
      return NextResponse.redirect(url);
    }
  }

  if (user && isAuthRoute && activeProfile) {
      if (
        activeProfile.role === "driver" &&
        activeProfile.agent_application_status === "pending"
      ) {
        const url = request.nextUrl.clone();
        url.pathname = "/register/agent/pending";
        return NextResponse.redirect(url);
      }

      const url = request.nextUrl.clone();
      url.pathname = destinationForProfile(activeProfile);
      return NextResponse.redirect(url);
  }

  return response;
}
