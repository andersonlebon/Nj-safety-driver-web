import Link from "next/link";
import { Card, CardBody } from "@/components/ui/Card";
import { AgentRegisterForm } from "./AgentRegisterForm";

export const metadata = {
  title: "Agent application | NJ Safety Driver",
};

export default function AgentRegisterPage() {
  return (
    <Card>
      <CardBody>
        <h1 className="text-xl font-semibold text-stone-900 dark:text-stone-100">
          Apply as a field agent
        </h1>
        <p className="mt-1 text-sm text-stone-600 dark:text-slate-400">
          Create your account and submit an application. An administrator will
          review and approve access to the agent workspace.
        </p>
        <div className="mt-6">
          <AgentRegisterForm />
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
