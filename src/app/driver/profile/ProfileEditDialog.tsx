"use client";

import { Pencil } from "lucide-react";
import { FormDialog } from "@/components/ui/FormDialog";
import { useI18n } from "@/i18n/context";
import { ProfileForm } from "./ProfileForm";
import type { Database } from "@/lib/types/database";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export function ProfileEditDialog({ profile }: { profile: Profile }) {
  const { t } = useI18n();

  return (
    <FormDialog
      triggerLabel={
        <>
          <Pencil className="h-4 w-4 mr-1.5" />
          {t("driver.profile.personal.editButton")}
        </>
      }
      title={t("driver.profile.personal.editDialogTitle")}
      description={t("driver.profile.personal.editDialogDescription")}
      modalClassName="max-w-xl"
    >
      {({ close }) => (
        <ProfileForm profile={profile} onSuccess={close} />
      )}
    </FormDialog>
  );
}
