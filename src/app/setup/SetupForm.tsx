"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { useI18n } from "@/i18n/context";
import { bootstrapAdmin } from "./actions";

export function SetupForm() {
  const { t } = useI18n();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const handleSubmit = (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      try {
        const result = await bootstrapAdmin(formData);
        if (result && !result.ok) {
          console.error("Setup failed", { error: result.error });
          setError(result.error);
          return;
        }
        router.refresh();
      } catch (error) {
        console.error("Setup submission crashed", error);
        setError(t("setup.form.unexpectedError"));
      }
    });
  };

  return (
    <form action={handleSubmit} className="space-y-4">
      {error && <Alert variant="error">{error}</Alert>}
      <Input
        label={t("setup.form.fullName")}
        name="full_name"
        autoComplete="name"
        required
      />
      <Input
        label={t("setup.form.email")}
        name="email"
        type="email"
        autoComplete="email"
        required
      />
      <Input
        label={t("setup.form.password")}
        name="password"
        type="password"
        autoComplete="new-password"
        minLength={8}
        required
        hint={t("setup.form.passwordHint")}
      />
      <Input
        label={t("setup.form.confirmPassword")}
        name="confirm_password"
        type="password"
        autoComplete="new-password"
        minLength={8}
        required
      />
      <Button type="submit" loading={pending} className="w-full">
        {t("setup.form.submit")}
      </Button>
    </form>
  );
}
