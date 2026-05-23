import Link from "next/link";
import { RegisterForm } from "./RegisterForm";
import { Card, CardBody } from "@/components/ui/Card";

export const metadata = {
  title: "Create account | NJ Safety Driver",
};

export default function RegisterPage() {
  return (
    <Card>
      <CardBody>
        <h1 className="text-xl font-semibold text-stone-900 dark:text-stone-100">
          Create your account
        </h1>
        <p className="mt-1 text-sm text-stone-600 dark:text-slate-400">
          Drivers can self-register. Agent and admin accounts must be assigned
          by an administrator.
        </p>
        <div className="mt-6">
          <RegisterForm />
        </div>
        <p className="mt-6 text-sm text-stone-600 dark:text-slate-400">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-brand-700 dark:text-brand-300 font-medium hover:underline"
          >
            Sign in
          </Link>
        </p>
      </CardBody>
    </Card>
  );
}
