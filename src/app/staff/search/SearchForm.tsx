"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { normalizePlate } from "@/lib/utils";
import { useI18n } from "@/i18n/context";

export function SearchForm({ initialPlate }: { initialPlate?: string }) {
  const router = useRouter();
  const { t } = useI18n();
  const [plate, setPlate] = useState(initialPlate || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = normalizePlate(plate);
    if (!normalized) return;
    router.push(`/staff/search?plate=${encodeURIComponent(normalized)}`);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
      <div className="flex-1">
        <Input
          name="plate"
          placeholder={t("staff.search.form.platePlaceholder")}
          value={plate}
          onChange={(e) => setPlate(e.target.value)}
          autoFocus
          required
        />
      </div>
      <Button type="submit">
        <Search className="h-4 w-4" />
        {t("staff.search.form.submit")}
      </Button>
    </form>
  );
}
