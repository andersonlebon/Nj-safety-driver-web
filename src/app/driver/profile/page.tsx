import { getCurrentProfile } from "@/lib/auth";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { ProfileForm } from "./ProfileForm";

export default async function DriverProfilePage() {
  const profile = await getCurrentProfile();
  return (
    <div>
      <PageHeader
        title="Personal information"
        description="Keep your contact and identity details up to date."
      />
      <Card>
        <CardBody>
          <ProfileForm profile={profile!} />
        </CardBody>
      </Card>
    </div>
  );
}
