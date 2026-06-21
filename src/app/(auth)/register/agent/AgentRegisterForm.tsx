"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Alert } from "@/components/ui/Alert";
import { useI18n } from "@/i18n/context";
import { submitAgentApplication } from "./actions";

type Props = {
  defaultFullName?: string;
  defaultPhone?: string;
};

export function AgentRegisterForm({ defaultFullName = "", defaultPhone = "" }: Props) {
  const { t } = useI18n();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await submitAgentApplication({
        full_name: String(form.get("full_name") ?? ""),
        phone: String(form.get("phone") ?? ""),
        agent_badge_id: String(form.get("agent_badge_id") ?? ""),
        note: String(form.get("note") ?? ""),
      });
      if (result && !result.ok) {
        setError(result.error);
      }
    });
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {error && <Alert variant="error">{error}</Alert>}
      <Alert variant="info">{t("auth.agentRegister.infoAlert")}</Alert>
      <Input
        label={t("auth.agentRegister.fullName")}
        name="full_name"
        autoComplete="name"
        defaultValue={defaultFullName}
        required
      />
      <Input
        label={t("auth.agentRegister.phone")}
        name="phone"
        type="tel"
        autoComplete="tel"
        placeholder={t("auth.agentRegister.phonePlaceholder")}
        defaultValue={defaultPhone}
        required
      />
      <Input
        label={t("auth.agentRegister.badgeId")}
        name="agent_badge_id"
        placeholder={t("auth.agentRegister.badgePlaceholder")}
      />
      <Textarea
        label={t("auth.agentRegister.noteLabel")}
        name="note"
        rows={3}
        placeholder={t("auth.agentRegister.notePlaceholder")}
      />
      <div className="flex flex-col gap-2 pt-1">
        <Button type="submit" loading={pending} className="w-full">
          {t("auth.agentRegister.submit")}
        </Button>
        <Link href="/profile" className="btn-secondary w-full text-center">
          {t("auth.agentRegister.backToProfile")}
        </Link>
      </div>
    </form>
  );
}
