"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { bootstrapAdmin } from "./actions";

export function SetupForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const handleSubmit = (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      try {
        const result = await bootstrapAdmin(formData);
        // `bootstrapAdmin` redirects on success, so we only ever observe a
        // returned value when something went wrong.
        if (result && !result.ok) {
          console.error("Setup failed", { error: result.error });
          setError(result.error);
          return;
        }
        router.refresh();
      } catch (error) {
        console.error("Setup submission crashed", error);
        setError("Setup failed unexpectedly. Check the console and try again.");
      }
    });
  };

  return (
    <form action={handleSubmit} className="space-y-4">
      {error && <Alert variant="error">{error}</Alert>}
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
        label="Password"
        name="password"
        type="password"
        autoComplete="new-password"
        minLength={8}
        required
        hint="Minimum 8 characters."
      />
      <Input
        label="Confirm password"
        name="confirm_password"
        type="password"
        autoComplete="new-password"
        minLength={8}
        required
      />
      <Button type="submit" loading={pending} className="w-full">
        Create administrator account
      </Button>
    </form>
  );
}
