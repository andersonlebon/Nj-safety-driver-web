import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentProfile } from "@/lib/auth";
import { SetupForm } from "./SetupForm";

export const dynamic = "force-dynamic";

async function countAdmins(): Promise<number> {
  const admin = createAdminClient();
  const { count, error } = await admin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", "admin");
  if (error) {
    // If we can't reach Postgres we treat the route as locked rather than
    // accidentally bootstrap a second admin during a transient outage.
    throw new Error(`Setup gate could not check admin count: ${error.message}`);
  }
  return count ?? 0;
}

export default async function SetupPage() {
  const profile = await getCurrentProfile();

  // Signed-in admin? Send them straight to their dashboard.
  if (profile?.role === "admin") {
    redirect("/admin");
  }

  const adminCount = await countAdmins();
  const locked = adminCount > 0;

  return (
    <div className="w-full max-w-md">
      <div className="flex items-center justify-center mb-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="h-9 w-9 rounded-lg bg-brand-600 grid place-items-center text-white">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <span className="font-semibold text-stone-900 dark:text-stone-100">
            NJ Safety Driver
          </span>
        </Link>
      </div>

      <Card>
        <CardBody>
          {locked ? (
            <div className="text-center py-2">
              <div className="mx-auto h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-950/40 grid place-items-center text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h1 className="mt-4 text-xl font-semibold text-stone-900 dark:text-stone-100">
                Setup already complete
              </h1>
              <p className="mt-2 text-sm text-stone-600 dark:text-slate-400">
                An administrator account exists for this installation, so the
                one-time setup route is locked.
              </p>
              <div className="mt-6">
                <Link
                  href="/login"
                  className="btn-primary w-full inline-flex justify-center"
                >
                  Go to sign in
                </Link>
              </div>
            </div>
          ) : (
            <>
              <h1 className="text-xl font-semibold text-stone-900 dark:text-stone-100">
                Create the first administrator
              </h1>
              <p className="mt-1 text-sm text-stone-600 dark:text-slate-400">
                This one-time form bootstraps the very first admin for your
                NJ Safety Driver installation. Once you submit, this route
                permanently locks and any further admins must be promoted from
                the admin dashboard.
              </p>
              <div className="mt-6">
                <SetupForm />
              </div>
            </>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
