import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { ACTIVE_PROFILE_COOKIE } from "@/lib/auth/profile-session";
import { resolveRouteProfile, isStaffProfileActive } from "@/lib/auth/route-access";
import type { ProfileRole } from "@/lib/types/database";

async function getRouteProfiles(
  supabase: ReturnType<typeof createServerClient>,
  userId: string
) {
  const { data } = await supabase
    .from("profiles")
    .select("id, user_id, role, onboarded_at")
    .eq("user_id", userId);
  return (data ?? []) as Array<{
    id: string;
    user_id: string;
    role: ProfileRole;
    onboarded_at: string | null;
  }>;
}

async function getRouteStaffProfile(
  supabase: ReturnType<typeof createServerClient>,
  profileId: string
) {
  const { data } = await supabase
    .from("staff_profiles")
    .select("profile_id, staff_role, application_status")
    .eq("profile_id", profileId)
    .maybeSingle();
  return data as {
    profile_id: string;
    staff_role: "agent" | "admin";
    application_status: string | null;
  } | null;
}

function setProfileCookie(response: NextResponse, profileId: string) {
  response.cookies.set(ACTIVE_PROFILE_COOKIE, profileId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

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

  const isDriverRoute = pathname.startsWith("/driver") || pathname.startsWith("/onboarding");
  const isStaffRoute = pathname.startsWith("/staff");
  const isProfileRoute = pathname === "/profile";
  const isProtectedRoute = isDriverRoute || isStaffRoute || isProfileRoute;
  const isLoginRoute = pathname.startsWith("/login");
  const isSignupRoute = pathname === "/register";
  const isRoleRegisterRoute =
    pathname.startsWith("/register/driver") ||
    pathname.startsWith("/register/agent");
  const isSetupRoute = pathname.startsWith("/setup");

  // Unauthenticated → redirect to login for protected routes
  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  if (!user) return response;

  // ── Authenticated user ──────────────────────────────────────────────────────

  const activeProfileId = request.cookies.get(ACTIVE_PROFILE_COOKIE)?.value ?? null;

  // Redirect authenticated users away from login/signup (not role registration)
  if (isLoginRoute || isSignupRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/profile";
    return NextResponse.redirect(url);
  }

  // Role registration flows are for signed-in users without that profile yet
  if (isRoleRegisterRoute) return response;

  // /profile is always accessible to authenticated users
  if (isProfileRoute) return response;

  // Setup route accessible to all authenticated
  if (isSetupRoute) return response;

  // ── Protected workspace routes ──────────────────────────────────────────────
  if (isDriverRoute || isStaffRoute) {
    const profiles = await getRouteProfiles(supabase, user.id);
    const requiredRole: ProfileRole = isDriverRoute ? "driver" : "staff";

    const resolution = resolveRouteProfile(profiles, activeProfileId, requiredRole);

    if (resolution.kind === "none") {
      const url = request.nextUrl.clone();
      url.pathname = "/profile";
      return NextResponse.redirect(url);
    }

    const { profileId, shouldSetCookie } = resolution;
    if (shouldSetCookie) setProfileCookie(response, profileId);

    // For staff routes, check application_status
    if (isStaffRoute) {
      const staffProfile = await getRouteStaffProfile(supabase, profileId);
      if (!staffProfile || !isStaffProfileActive(staffProfile)) {
        // Pending agent → show pending page
        if (staffProfile?.application_status === "pending") {
          if (!pathname.startsWith("/register/agent/pending")) {
            const url = request.nextUrl.clone();
            url.pathname = "/register/agent/pending";
            return NextResponse.redirect(url);
          }
        } else {
          const url = request.nextUrl.clone();
          url.pathname = "/profile";
          return NextResponse.redirect(url);
        }
      }
    }

    // Driver routes remain accessible before onboarding completes; profile page
    // hosts the onboarding wizard and document uploads.
  }

  return response;
}
