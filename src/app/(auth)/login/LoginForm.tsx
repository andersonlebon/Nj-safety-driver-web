"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { completeLoginAfterSignIn } from "@/app/auth/actions";
import { friendlyError } from "@/lib/errors";
import type { LoginPortal } from "@/lib/auth/profile-session";
import { portalLabel, portalLoginPath } from "@/lib/auth/profile-session";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { useI18n } from "@/i18n/context";

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

type Props = {
  portal?: LoginPortal;
  title?: string;
  hint?: string;
};

export function LoginForm({ portal, title, hint }: Props) {
  const { t } = useI18n();
  const router = useRouter();
  const params = useSearchParams();
  const redirectTo = params.get("redirect") || "";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const normalizedEmail = normalizeEmail(email);
    const supabase = createClient();
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (signInError) {
      setError(friendlyError(signInError));
      setLoading(false);
      return;
    }

    const user = data.session?.user ?? data.user;
    if (!user) {
      setError("Authentication succeeded but no session was created. Please try again.");
      setLoading(false);
      return;
    }

    const result = await completeLoginAfterSignIn({
      portal,
      redirectTo: redirectTo || undefined,
    });

    if (!result.ok) {
      setError(result.error);
      setLoading(false);
      return;
    }

    router.replace(result.redirectTo);
    router.refresh();
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {error && (
        <Alert variant="error">
          {error}
          {portal && (
            <span className="block mt-2 text-xs">
              Wrong portal?{" "}
              <Link href="/login" className="underline">
                Driver
              </Link>
              {" · "}
              <Link href="/login/agent" className="underline">
                Agent
              </Link>
              {" · "}
              <Link href="/login/admin" className="underline">
                Admin
              </Link>
            </span>
          )}
        </Alert>
      )}
      {title && (
        <p className="text-sm font-medium text-stone-800 dark:text-stone-200">{title}</p>
      )}
      {hint && <p className="text-xs text-stone-500 dark:text-slate-400">{hint}</p>}
      <Input
        label={t("auth.email")}
        type="email"
        name="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <Input
        label={t("auth.password")}
        type="password"
        name="password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <Button type="submit" loading={loading} className="w-full">
        {portal ? `Sign in as ${portalLabel(portal)}` : t("auth.signIn")}
      </Button>
      {portal && portal !== "driver" && (
        <p className="text-xs text-center text-stone-500 dark:text-slate-400">
          Not {portalLabel(portal).toLowerCase()} staff?{" "}
          <Link href={portalLoginPath("driver")} className="underline">
            Driver sign-in
          </Link>
        </p>
      )}
    </form>
  );
}
