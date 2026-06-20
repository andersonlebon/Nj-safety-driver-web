"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Alert } from "@/components/ui/Alert";
import { submitAgentApplication } from "./actions";

type Props = {
  defaultFullName?: string;
  defaultPhone?: string;
};

export function AgentRegisterForm({ defaultFullName = "", defaultPhone = "" }: Props) {
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
      <Alert variant="info">
        Agent accounts require administrator approval before you can access the
        agent dashboard.
      </Alert>
      <Input
        label="Full name"
        name="full_name"
        autoComplete="name"
        defaultValue={defaultFullName}
        required
      />
      <Input
        label="Phone"
        name="phone"
        type="tel"
        autoComplete="tel"
        placeholder="+241 ..."
        defaultValue={defaultPhone}
        required
      />
      <Input
        label="Badge / employee ID (optional)"
        name="agent_badge_id"
        placeholder="Ministry badge number"
      />
      <Textarea
        label="Why do you want agent access?"
        name="note"
        rows={3}
        placeholder="Your role, station, or supervisor contact..."
      />
      <div className="flex flex-col gap-2 pt-1">
        <Button type="submit" loading={pending} className="w-full">
          Submit agent application
        </Button>
        <Link href="/profile" className="btn-secondary w-full text-center">
          Back to profile
        </Link>
      </div>
    </form>
  );
}
