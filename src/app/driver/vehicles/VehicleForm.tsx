"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Alert } from "@/components/ui/Alert";
import { normalizePlate } from "@/lib/utils";

export function VehicleForm({ ownerId }: { ownerId: string }) {
  const router = useRouter();
  const [form, setForm] = useState({
    plate_number: "",
    brand: "",
    model: "",
    color: "",
    year: "",
    insurance_status: "false",
    inspection_status: "false",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (field: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: insertError } = await supabase.from("vehicles").insert({
      owner_id: ownerId,
      plate_number: normalizePlate(form.plate_number),
      brand: form.brand || null,
      model: form.model || null,
      color: form.color || null,
      year: form.year ? Number(form.year) : null,
      insurance_status: form.insurance_status === "true",
      inspection_status: form.inspection_status === "true",
    });

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    setForm({
      plate_number: "",
      brand: "",
      model: "",
      color: "",
      year: "",
      insurance_status: "false",
      inspection_status: "false",
    });
    setLoading(false);
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <Alert variant="error">{error}</Alert>}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Input
          label="Plate number"
          name="plate_number"
          value={form.plate_number}
          onChange={handleChange("plate_number")}
          required
        />
        <Input
          label="Brand"
          name="brand"
          value={form.brand}
          onChange={handleChange("brand")}
        />
        <Input
          label="Model"
          name="model"
          value={form.model}
          onChange={handleChange("model")}
        />
        <Input
          label="Color"
          name="color"
          value={form.color}
          onChange={handleChange("color")}
        />
        <Input
          label="Year"
          type="number"
          min={1900}
          max={2100}
          name="year"
          value={form.year}
          onChange={handleChange("year")}
        />
        <Select
          label="Insurance status"
          name="insurance_status"
          value={form.insurance_status}
          onChange={handleChange("insurance_status")}
        >
          <option value="false">Not insured</option>
          <option value="true">Insured</option>
        </Select>
        <Select
          label="Technical inspection"
          name="inspection_status"
          value={form.inspection_status}
          onChange={handleChange("inspection_status")}
        >
          <option value="false">Not inspected</option>
          <option value="true">Inspection valid</option>
        </Select>
      </div>
      <div>
        <Button type="submit" loading={loading}>
          Register vehicle
        </Button>
      </div>
    </form>
  );
}
