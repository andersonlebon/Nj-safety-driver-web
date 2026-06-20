import { redirect } from "next/navigation";
import { requireDriverProfile } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const { profile } = await requireDriverProfile();
  redirect(profile.onboarded_at ? "/driver" : "/driver/profile");
}
