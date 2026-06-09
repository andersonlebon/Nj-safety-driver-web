"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { friendlyError } from "@/lib/errors";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Alert } from "@/components/ui/Alert";
import { Select } from "@/components/ui/Select";
import { COUNTRIES, DEFAULT_COUNTRY } from "@/lib/countries";
import type { Database } from "@/lib/types/database";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export function ProfileForm({
  profile,
  onSuccess,
}: {
  profile: Profile;
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    full_name: profile.full_name ?? "",
    phone: profile.phone ?? "",
    national_id: profile.national_id ?? "",
    driver_license: profile.driver_license ?? "",
    address: profile.address ?? "",
    nationality_country: profile.nationality_country ?? DEFAULT_COUNTRY,
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (field: keyof typeof form) => (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
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
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        full_name: form.full_name || null,
        phone: form.phone || null,
        national_id: form.national_id || null,
        driver_license: form.driver_license || null,
        address: form.address || null,
        nationality_country: form.nationality_country || DEFAULT_COUNTRY,
      })
      .eq("id", profile.id);

    if (updateError) {
      setError(friendlyError(updateError));
      setLoading(false);
      return;
    }

    setSuccess("Profile updated successfully.");
    setLoading(false);
    router.refresh();
    onSuccess?.();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <Alert variant="error">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Full name"
          name="full_name"
          value={form.full_name}
          onChange={handleChange("full_name")}
        />
        <Input
          label="Phone number"
          name="phone"
          value={form.phone}
          onChange={handleChange("phone")}
        />
        <Input
          label="National ID number"
          name="national_id"
          value={form.national_id}
          onChange={handleChange("national_id")}
        />
        <Input
          label="Driver license number"
          name="driver_license"
          value={form.driver_license}
          onChange={handleChange("driver_license")}
        />
        <Select
          label="Nationality"
          name="nationality_country"
          value={form.nationality_country}
          onChange={handleChange("nationality_country")}
        >
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.flag} {c.name}
            </option>
          ))}
        </Select>
      </div>
      <Textarea
        label="Address"
        name="address"
        value={form.address}
        onChange={handleChange("address")}
      />
      <div>
        <Button type="submit" loading={loading}>
          Save changes
        </Button>
      </div>
    </form>
  );
}
