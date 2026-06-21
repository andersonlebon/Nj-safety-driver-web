"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FormDialog } from "@/components/ui/FormDialog";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { PlateScanField } from "@/components/camera/PlateScanField";
import { COUNTRIES, DEFAULT_COUNTRY } from "@/lib/countries";
import { normalizePlateForCountry } from "@/lib/vehicles";
import { useI18n } from "@/i18n/context";

export function SearchPlateDialog({
  initialPlate,
  initialCountry,
}: {
  initialPlate?: string;
  initialCountry?: string;
}) {
  const router = useRouter();
  const { t } = useI18n();
  const [plate, setPlate] = useState(initialPlate ?? "");
  const [country, setCountry] = useState(initialCountry ?? DEFAULT_COUNTRY);

  const search = (close: () => void) => {
    const q = normalizePlateForCountry(plate.trim(), country);
    if (!q) return;
    close();
    router.push(
      `/staff/search?plate=${encodeURIComponent(q)}&country=${encodeURIComponent(country)}`
    );
  };

  return (
    <FormDialog
      triggerLabel={
        <>
          <Search className="h-4 w-4 mr-1.5" />
          {t("staff.search.dialog.trigger")}
        </>
      }
      title={t("staff.search.dialog.title")}
      description={t("staff.search.dialog.description")}
      modalClassName="max-w-md"
    >
      {({ close }) => (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            search(close);
          }}
        >
          <Select
            label={t("staff.search.dialog.plateCountry")}
            value={country}
            onChange={(e) => setCountry(e.target.value)}
          >
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.flag} {c.name}
              </option>
            ))}
          </Select>
          <PlateScanField value={plate} onChange={setPlate} />
          <Button type="submit" className="w-full">
            {t("staff.search.dialog.submit")}
          </Button>
        </form>
      )}
    </FormDialog>
  );
}
