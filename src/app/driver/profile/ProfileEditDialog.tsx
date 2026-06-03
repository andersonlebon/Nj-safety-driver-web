"use client";

import { Pencil } from "lucide-react";
import { FormDialog } from "@/components/ui/FormDialog";
import { ProfileForm } from "./ProfileForm";
import type { Database } from "@/lib/types/database";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export function ProfileEditDialog({ profile }: { profile: Profile }) {
  return (
    <FormDialog
      triggerLabel={
        <>
          <Pencil className="h-4 w-4 mr-1.5" />
          Edit profile
        </>
      }
      title="Personal information"
      description="Update your contact and identity details."
      modalClassName="max-w-xl"
    >
      {({ close }) => (
        <ProfileForm profile={profile} onSuccess={close} />
      )}
    </FormDialog>
  );
}
