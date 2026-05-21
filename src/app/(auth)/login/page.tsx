import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "./LoginForm";
import { Card, CardBody } from "@/components/ui/Card";

export const metadata = {
  title: "Sign in | NJ Safety Driver",
};

export default function LoginPage() {
  return (
    <Card>
      <CardBody>
        <h1 className="text-xl font-semibold text-slate-900">Sign in</h1>
        <p className="mt-1 text-sm text-slate-600">
          Use your account credentials to access your dashboard.
        </p>
        <div className="mt-6">
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
        <p className="mt-6 text-sm text-slate-600">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-brand-700 font-medium hover:underline">
            Create one
          </Link>
        </p>
      </CardBody>
    </Card>
  );
}
