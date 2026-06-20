"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { registerAsDriver } from "./actions";

type Props = {
  defaultFullName?: string;
  defaultPhone?: string;
};

export function DriverRegisterForm({ defaultFullName = "", defaultPhone = "" }: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await registerAsDriver({
        full_name: String(form.get("full_name") ?? ""),
        phone: String(form.get("phone") ?? ""),
      });
      if (result && !result.ok) {
        setError(result.error);
      }
    });
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {error && <Alert variant="error">{error}</Alert>}
      <Input
        label="Full name"
        name="full_name"
        autoComplete="name"
        defaultValue={defaultFullName}
        required
      />
      <Input
        label="Phone (optional)"
        name="phone"
        type="tel"
        autoComplete="tel"
        placeholder="+241 ..."
        defaultValue={defaultPhone}
      />
      <Button type="submit" loading={pending} className="w-full">
        {defaultFullName ? "Continue as driver" : "Create driver profile"}
      </Button>
    </form>
  );
}
