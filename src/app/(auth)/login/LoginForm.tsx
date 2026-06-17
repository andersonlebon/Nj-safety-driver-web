"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { friendlyError } from "@/lib/errors";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { useI18n } from "@/i18n/context";

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function LoginForm() {
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

    if (redirectTo) {
      router.replace(redirectTo);
      router.refresh();
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, onboarded_at")
      .eq("id", user.id)
      .single();

    const role = profile?.role ?? "driver";
    const destination =
      role === "driver" && !profile?.onboarded_at ? "/onboarding" : `/${role}`;

    router.replace(destination);
    router.refresh();
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {error && <Alert variant="error">{error}</Alert>}
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
        {t("auth.signIn")}
      </Button>
    </form>
  );
}
