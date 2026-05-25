import Link from "next/link";
import { redirect } from "next/navigation";
import { Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

export const metadata = {
  title: "Application pending | NJ Safety Driver",
};

export default async function AgentPendingPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/register/agent/pending");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, agent_application_status, admin_message")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role === "agent" || profile?.role === "admin") {
    redirect(`/${profile.role}`);
  }

  if (profile?.agent_application_status === "rejected") {
    return (
      <Card>
        <CardBody className="text-center space-y-4">
          <Alert variant="error">
            Your agent application was not approved.
            {profile.admin_message && (
              <span className="block mt-2">{profile.admin_message}</span>
            )}
          </Alert>
          <Link href="/" className="btn-secondary inline-block">
            Back to home
          </Link>
        </CardBody>
      </Card>
    );
  }

  if (profile?.agent_application_status !== "pending") {
    redirect("/register/agent");
  }

  return (
    <Card>
      <CardBody className="text-center space-y-4 py-8">
        <div className="mx-auto h-14 w-14 rounded-full bg-brand-100 dark:bg-brand-950 grid place-items-center text-brand-700 dark:text-brand-300">
          <Clock className="h-7 w-7" />
        </div>
        <h1 className="text-xl font-semibold text-stone-900 dark:text-stone-100">
          Application under review
        </h1>
        <p className="text-sm text-stone-600 dark:text-slate-400 max-w-md mx-auto">
          Thank you for applying. An administrator will review your request and
          approve your agent account. You will receive access to the agent
          dashboard once approved.
        </p>
        <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
          <form action="/auth/signout" method="POST">
            <Button type="submit" variant="secondary">
              Sign out
            </Button>
          </form>
          <Link href="/">
            <Button type="button" variant="secondary">
              Back to home
            </Button>
          </Link>
        </div>
      </CardBody>
    </Card>
  );
}
