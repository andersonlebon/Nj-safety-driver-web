"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Alert } from "@/components/ui/Alert";
import { submitAgentApplication } from "./actions";

export function AgentRegisterForm() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [needsEmailConfirmation, setNeedsEmailConfirmation] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await submitAgentApplication({
        full_name: String(form.get("full_name") ?? ""),
        email: String(form.get("email") ?? ""),
        password: String(form.get("password") ?? ""),
        phone: String(form.get("phone") ?? ""),
        agent_badge_id: String(form.get("agent_badge_id") ?? ""),
        note: String(form.get("note") ?? ""),
      });
      if (result && !result.ok) {
        setError(result.error);
        return;
      }
      if (result?.ok) {
        setSubmitted(true);
        setNeedsEmailConfirmation(Boolean(result.needsEmailConfirmation));
      }
    });
  };

  if (submitted) {
    return (
      <Alert variant="success">
        {needsEmailConfirmation
          ? "Application submitted. Confirm your email, then sign in — an administrator will review your request."
          : "Application submitted. You will be redirected once an administrator approves your account."}
      </Alert>
    );
  }

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
        required
      />
      <Input
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        required
      />
      <Input
        label="Phone"
        name="phone"
        type="tel"
        autoComplete="tel"
        placeholder="+241 ..."
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
      <Input
        label="Password"
        name="password"
        type="password"
        autoComplete="new-password"
        minLength={8}
        required
      />
      <Button type="submit" loading={pending} className="w-full">
        Submit agent application
      </Button>
      <p className="text-sm text-stone-600 dark:text-slate-400 text-center">
        Registering as a driver instead?{" "}
        <Link
          href="/register"
          className="text-brand-700 dark:text-brand-300 font-medium hover:underline"
        >
          Driver sign-up
        </Link>
      </p>
    </form>
  );
}
