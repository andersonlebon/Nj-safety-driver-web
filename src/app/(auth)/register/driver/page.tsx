import { redirect } from "next/navigation";
import { AuthDialogCard } from "@/components/ui/AuthDialogCard";
import { getSessionUser, getProfiles } from "@/lib/auth";
import { DriverRegisterForm } from "./DriverRegisterForm";

export const metadata = {
  title: "Register as driver | NJ Safety Driver",
};

export const dynamic = "force-dynamic";

export default async function DriverRegisterPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?redirect=/register/driver");

  const profiles = await getProfiles();
  if (profiles.some((p) => p.role === "driver")) redirect("/driver");

  const anyProfile = profiles[0];

  return (
    <AuthDialogCard>
      <h1 className="text-xl font-semibold text-stone-900 dark:text-stone-100">
        Register as a driver
      </h1>
      <p className="mt-1 text-sm text-stone-600 dark:text-slate-400">
        Set up your driver profile to manage vehicles, documents, and infractions.
      </p>
      <div className="mt-6">
        <DriverRegisterForm
          defaultFullName={anyProfile?.full_name ?? ""}
          defaultPhone={anyProfile?.phone ?? ""}
        />
      </div>
    </AuthDialogCard>
  );
}
