"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";

export function RegisterForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);

    const supabase = createClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role: "driver" },
        emailRedirectTo:
          (process.env.NEXT_PUBLIC_SITE_URL || window.location.origin) +
          "/login",
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (!data.session) {
      setInfo(
        "Account created. Please check your email to confirm your address before signing in."
      );
      setLoading(false);
      return;
    }

    router.replace("/driver");
    router.refresh();
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {error && <Alert variant="error">{error}</Alert>}
      {info && <Alert variant="success">{info}</Alert>}
      <Input
        label="Full name"
        name="full_name"
        autoComplete="name"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        required
      />
      <Input
        label="Email"
        type="email"
        name="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <Input
        label="Password"
        type="password"
        name="password"
        autoComplete="new-password"
        minLength={6}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <Button type="submit" loading={loading} className="w-full">
        Create account
      </Button>
    </form>
  );
}
