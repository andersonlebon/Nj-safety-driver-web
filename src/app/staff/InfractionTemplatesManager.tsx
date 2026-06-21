"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Alert } from "@/components/ui/Alert";
import { formatCurrency } from "@/lib/utils";
import { saveInfractionTemplate } from "./actions";
import { useI18n } from "@/i18n/context";
import type { Database } from "@/lib/types/database";

type Template = Database["public"]["Tables"]["infraction_templates"]["Row"];

const emptyTemplate = {
  id: "",
  code: "",
  label: "",
  amount: "",
  points: "2",
  category: "safety",
  active: true,
};

export function InfractionTemplatesManager({
  templates,
}: {
  templates: Template[];
}) {
  const router = useRouter();
  const { t } = useI18n();
  const [form, setForm] = useState(emptyTemplate);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage(null);
    const fd = new FormData(e.currentTarget);
    const payload = {
      code: String(fd.get("code") ?? "").trim(),
      label: String(fd.get("label") ?? "").trim(),
      amount: String(fd.get("amount") ?? "").trim(),
      points: fd.get("points") ? Number(fd.get("points")) : undefined,
      category: fd.get("category") ? String(fd.get("category")) : undefined,
    };
    startTransition(async () => {
      const result = await saveInfractionTemplate(payload);
      if (!result.ok) {
        setMessage({ type: "error", text: result.error });
        return;
      }
      setMessage({ type: "success", text: t("staff.templates.manager.successSaved") });
      setForm(emptyTemplate);
      router.refresh();
    });
  };

  const edit = (template: Template) => {
    setForm({
      id: template.id,
      code: template.code,
      label: template.label,
      amount: String(template.amount),
      points: String(template.points),
      category: template.category,
      active: template.active,
    });
    setMessage(null);
  };

  const toggleActive = (template: Template) => {
    startTransition(async () => {
      const result = await saveInfractionTemplate({
        code: template.code,
        label: template.label,
        amount: String(template.amount),
        points: template.points,
        category: template.category,
      });
      if (!result.ok) {
        setMessage({ type: "error", text: result.error });
        return;
      }
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      {message && (
        <Alert variant={message.type === "success" ? "success" : "error"}>
          {message.text}
        </Alert>
      )}

      <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-6 gap-3 rounded-lg border border-stone-200 dark:border-slate-800 p-4">
        <input type="hidden" name="id" value={form.id} />
        <Input
          label={t("staff.templates.manager.code")}
          name="code"
          value={form.code}
          onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value }))}
          placeholder={t("staff.templates.manager.codePlaceholder")}
        />
        <div className="md:col-span-2">
          <Input
            label={t("staff.templates.manager.label")}
            name="label"
            value={form.label}
            onChange={(e) => setForm((prev) => ({ ...prev, label: e.target.value }))}
            placeholder={t("staff.templates.manager.labelPlaceholder")}
            required
          />
        </div>
        <Input
          label={t("staff.templates.manager.amount")}
          name="amount"
          type="number"
          min="0"
          step="1"
          value={form.amount}
          onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
          required
        />
        <Input
          label={t("staff.templates.manager.points")}
          name="points"
          type="number"
          min="0"
          step="1"
          value={form.points}
          onChange={(e) => setForm((prev) => ({ ...prev, points: e.target.value }))}
          required
        />
        <Select
          label={t("staff.templates.manager.category")}
          name="category"
          value={form.category}
          onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
        >
          <option value="safety">{t("staff.templates.manager.categorySafety")}</option>
          <option value="documents">{t("staff.templates.manager.categoryDocuments")}</option>
          <option value="parking">{t("staff.templates.manager.categoryParking")}</option>
          <option value="conduct">{t("staff.templates.manager.categoryConduct")}</option>
        </Select>
        <input type="hidden" name="active" value={String(form.active)} />
        <div className="md:col-span-6 flex flex-wrap justify-end gap-2">
          {form.id && (
            <Button
              type="button"
              variant="secondary"
              onClick={() => setForm(emptyTemplate)}
              disabled={pending}
            >
              {t("staff.templates.manager.cancelEdit")}
            </Button>
          )}
          <Button type="submit" loading={pending}>
            {form.id
              ? t("staff.templates.manager.update")
              : t("staff.templates.manager.create")}
          </Button>
        </div>
      </form>

      <div className="overflow-x-auto rounded-lg border border-stone-200 dark:border-slate-800">
        <table className="w-full text-sm">
          <thead className="text-left bg-stone-50/60 dark:bg-slate-900/60 text-stone-500 dark:text-slate-400">
            <tr>
              <th className="py-2 px-3 font-medium">{t("staff.templates.manager.headerLabel")}</th>
              <th className="py-2 px-3 font-medium">{t("staff.templates.manager.headerAmount")}</th>
              <th className="py-2 px-3 font-medium">{t("staff.templates.manager.headerPoints")}</th>
              <th className="py-2 px-3 font-medium">{t("staff.templates.manager.headerCategory")}</th>
              <th className="py-2 px-3 font-medium">{t("staff.templates.manager.headerStatus")}</th>
              <th className="py-2 px-3 font-medium text-right">{t("staff.templates.manager.headerActions")}</th>
            </tr>
          </thead>
          <tbody>
            {templates.map((template) => (
              <tr key={template.id} className="border-t border-stone-100 dark:border-slate-800">
                <td className="py-2 px-3 font-medium text-stone-900 dark:text-stone-100">
                  {template.label}
                  <span className="block font-mono text-[11px] text-stone-400">
                    {template.code}
                  </span>
                </td>
                <td className="py-2 px-3">{formatCurrency(Number(template.amount))}</td>
                <td className="py-2 px-3">{template.points}</td>
                <td className="py-2 px-3 capitalize">{template.category}</td>
                <td className="py-2 px-3">
                  <span className={template.active ? "badge-paid" : "badge-unpaid"}>
                    {template.active
                      ? t("staff.templates.manager.statusActive")
                      : t("staff.templates.manager.statusInactive")}
                  </span>
                </td>
                <td className="py-2 px-3">
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="secondary" onClick={() => edit(template)}>
                      {t("staff.templates.manager.edit")}
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => toggleActive(template)}
                      loading={pending}
                    >
                      {template.active
                        ? t("staff.templates.manager.disable")
                        : t("staff.templates.manager.enable")}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
