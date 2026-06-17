import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "../LoginForm";
import { AuthDialogCard } from "@/components/ui/AuthDialogCard";

export default function AdminLoginPage() {
  return (
    <AuthDialogCard>
      <h1 className="text-xl font-semibold text-stone-900 dark:text-stone-100">
        Administrator sign-in
      </h1>
      <p className="mt-1 text-sm text-stone-600 dark:text-slate-400">
        Administrators only. Agents and drivers must use their own sign-in pages.
      </p>
      <div className="mt-6">
        <Suspense>
          <LoginForm portal="admin" />
        </Suspense>
      </div>
      <p className="mt-6 text-sm text-stone-600 dark:text-slate-400">
        <Link href="/login" className="text-brand-700 dark:text-brand-300 font-medium hover:underline">
          Driver sign-in
        </Link>
        {" · "}
        <Link href="/login/agent" className="text-brand-700 dark:text-brand-300 font-medium hover:underline">
          Agent sign-in
        </Link>
      </p>
    </AuthDialogCard>
  );
}
