"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { normalizePlate } from "@/lib/utils";

export function SearchForm({ initialPlate }: { initialPlate?: string }) {
  const router = useRouter();
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
          placeholder="Enter plate number, e.g. ABC-1234"
          value={plate}
          onChange={(e) => setPlate(e.target.value)}
          autoFocus
          required
        />
      </div>
      <Button type="submit">
        <Search className="h-4 w-4" />
        Search
      </Button>
    </form>
  );
}
