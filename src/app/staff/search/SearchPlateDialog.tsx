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

export function SearchPlateDialog({
  initialPlate,
  initialCountry,
}: {
  initialPlate?: string;
  initialCountry?: string;
}) {
  const router = useRouter();
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
          Scan / search plate
        </>
      }
      title="Plate search & scan"
      description="Use the camera to capture a plate, then check fines and vehicle history."
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
            label="Plate country"
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
            Search & check fines
          </Button>
        </form>
      )}
    </FormDialog>
  );
}
