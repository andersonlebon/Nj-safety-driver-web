import Link from "next/link";
import { Suspense } from "react";
import { ShieldCheck } from "lucide-react";
import { LoginForm } from "./LoginForm";
import { Card, CardBody } from "@/components/ui/Card";
import { AuthDialogCard } from "@/components/ui/AuthDialogCard";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata = {
  title: "Sign in | NJ Safety Driver",
};

export const dynamic = "force-dynamic";

/**
 * Returns true when at least one admin exists. Swallows errors (missing service
 * key, transient DB outage) and returns `true` so we don't show the bootstrap
 * banner in environments where we can't verify the state.
 */
async function adminExists(): Promise<boolean> {
  try {
    const admin = createAdminClient();
    const { count } = await admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin");
    return (count ?? 0) > 0;
  } catch {
    return true;
  }
}

export default async function LoginPage() {
  const hasAdmin = await adminExists();

  return (
    <AuthDialogCard>
        {!hasAdmin && (
          <Link
            href="/setup"
            className="mb-6 flex items-start gap-3 rounded-xl border border-brand-200 dark:border-brand-900/40 bg-brand-50/60 dark:bg-brand-950/30 p-3 hover:bg-brand-50 dark:hover:bg-brand-950/50 transition-colors"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-brand-600 text-white">
              <ShieldCheck className="h-4 w-4" />
            </span>
            <span className="text-sm">
              <span className="block font-medium text-brand-900 dark:text-brand-200">
                First-time setup
              </span>
              <span className="text-brand-800/80 dark:text-brand-300/80">
                No administrator yet — create the first one to bootstrap the
                system.
              </span>
            </span>
          </Link>
        )}
        <h1 className="text-xl font-semibold text-stone-900 dark:text-stone-100">
          Sign in
        </h1>
        <p className="mt-1 text-sm text-stone-600 dark:text-slate-400">
          Use your account credentials to access your dashboard.
        </p>
        <div className="mt-6">
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
        <p className="mt-6 text-sm text-stone-600 dark:text-slate-400">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="text-brand-700 dark:text-brand-300 font-medium hover:underline"
          >
            Create one
          </Link>
        </p>
        <p className="mt-3 text-sm text-stone-600 dark:text-slate-400">
          Field agent?{" "}
          <Link
            href="/register/agent"
            className="text-brand-700 dark:text-brand-300 font-medium hover:underline"
          >
            Apply as an agent
          </Link>
        </p>
    </AuthDialogCard>
  );
}
