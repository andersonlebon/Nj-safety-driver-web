import { redirect } from "next/navigation";
import { AuthDialogCard } from "@/components/ui/AuthDialogCard";
import { getSessionUser, getProfile } from "@/lib/auth";
import { DriverRegisterForm } from "./DriverRegisterForm";
import type { UserRole } from "@/lib/types/database";

export const metadata = {
  title: "Register as driver | NJ Safety Driver",
};

export const dynamic = "force-dynamic";

export default async function DriverRegisterPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?redirect=/register/driver");

  const profile = await getProfile();

  const types = (profile?.profile_types as UserRole[]) ?? [];
  if (types.includes("driver")) redirect("/driver");

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
          defaultFullName={profile?.full_name ?? ""}
          defaultPhone={profile?.phone ?? ""}
        />
      </div>
    </AuthDialogCard>
  );
}
