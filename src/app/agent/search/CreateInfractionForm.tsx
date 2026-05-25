"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { friendlyError } from "@/lib/errors";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Alert } from "@/components/ui/Alert";
import type { PaymentStatus } from "@/lib/types/database";

const types = [
  "Speeding",
  "Running red light",
  "Illegal parking",
  "Reckless driving",
  "Driving without insurance",
  "Expired inspection",
  "No seatbelt",
  "Other",
];

export function CreateInfractionForm({
  plate,
  vehicleId,
  driverId,
  agentId,
}: {
  plate: string;
  vehicleId: string | null;
  driverId: string | null;
  agentId: string;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    infraction_type: types[0],
    description: "",
    location: "",
    fine_amount: "",
    status: "unpaid" as PaymentStatus,
  });
  const [evidence, setEvidence] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleChange = (field: keyof typeof form) => (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const supabase = createClient();
    let evidencePath: string | null = null;

    if (evidence) {
      const ext = evidence.name.split(".").pop() || "jpg";
      const path = `${plate}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("evidence")
        .upload(path, evidence, { cacheControl: "3600", upsert: false });
      if (uploadError) {
        setError(friendlyError(uploadError));
        setLoading(false);
        return;
      }
      evidencePath = path;
    }

    const { error: insertError } = await supabase.from("infractions").insert({
      plate_number: plate,
      vehicle_id: vehicleId,
      driver_id: driverId,
      agent_id: agentId,
      infraction_type: form.infraction_type,
      description: form.description || null,
      location: form.location || null,
      fine_amount: form.fine_amount ? Number(form.fine_amount) : 0,
      status: form.status,
      evidence_path: evidencePath,
    });

    if (insertError) {
      setError(friendlyError(insertError));
      setLoading(false);
      return;
    }

    setForm({
      infraction_type: types[0],
      description: "",
      location: "",
      fine_amount: "",
      status: "unpaid",
    });
    setEvidence(null);
    if (fileRef.current) fileRef.current.value = "";
    setSuccess("Infraction filed successfully.");
    setLoading(false);
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <Alert variant="error">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <Select
        label="Infraction type"
        name="infraction_type"
        value={form.infraction_type}
        onChange={handleChange("infraction_type")}
      >
        {types.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </Select>
      <Textarea
        label="Description"
        name="description"
        value={form.description}
        onChange={handleChange("description")}
        placeholder="Add details about the infraction"
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Location"
          name="location"
          value={form.location}
          onChange={handleChange("location")}
        />
        <Input
          label="Fine amount"
          type="number"
          min="0"
          step="0.01"
          name="fine_amount"
          value={form.fine_amount}
          onChange={handleChange("fine_amount")}
          required
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label="Status"
          name="status"
          value={form.status}
          onChange={handleChange("status")}
        >
          <option value="unpaid">Unpaid</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
        </Select>
        <Input
          ref={fileRef}
          label="Evidence (image)"
          type="file"
          accept="image/*"
          onChange={(e) => setEvidence(e.target.files?.[0] || null)}
        />
      </div>
      <div>
        <Button type="submit" loading={loading}>
          File infraction
        </Button>
      </div>
    </form>
  );
}
