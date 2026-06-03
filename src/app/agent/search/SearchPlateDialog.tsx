"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FormDialog } from "@/components/ui/FormDialog";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { normalizePlate } from "@/lib/utils";

export function SearchPlateDialog({ initialPlate }: { initialPlate?: string }) {
  const router = useRouter();
  const [plate, setPlate] = useState(initialPlate ?? "");

  const search = (close: () => void) => {
    const q = normalizePlate(plate.trim());
    if (!q) return;
    close();
    router.push(`/agent/search?plate=${encodeURIComponent(q)}`);
  };

  return (
    <FormDialog
      triggerLabel={
        <>
          <Search className="h-4 w-4 mr-1.5" />
          Search plate
        </>
      }
      title="Vehicle plate search"
      description="Enter a plate number to view the driver, vehicle, and infraction history."
    >
      {({ close }) => (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            search(close);
          }}
        >
          <Input
            label="Plate number"
            name="plate"
            value={plate}
            onChange={(e) => setPlate(e.target.value)}
            placeholder="e.g. AB-123-CD"
            autoFocus
            required
          />
          <Button type="submit" className="w-full">
            Search
          </Button>
        </form>
      )}
    </FormDialog>
  );
}
