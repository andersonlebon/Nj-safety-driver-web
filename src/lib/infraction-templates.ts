export type InfractionTemplate = {
  code: string;
  label: string;
  amount: number;
  points: number;
  category: "safety" | "documents" | "parking" | "conduct";
};

export const INFRACTION_TEMPLATES: readonly InfractionTemplate[] = [
  {
    code: "speeding",
    label: "Speeding",
    amount: 25000,
    points: 2,
    category: "safety",
  },
  {
    code: "running_red_light",
    label: "Running red light",
    amount: 30000,
    points: 2,
    category: "safety",
  },
  {
    code: "illegal_parking",
    label: "Illegal parking",
    amount: 10000,
    points: 1,
    category: "parking",
  },
  {
    code: "reckless_driving",
    label: "Reckless driving",
    amount: 50000,
    points: 4,
    category: "conduct",
  },
  {
    code: "driving_without_insurance",
    label: "Driving without insurance",
    amount: 75000,
    points: 5,
    category: "documents",
  },
  {
    code: "expired_inspection",
    label: "Expired inspection",
    amount: 40000,
    points: 3,
    category: "documents",
  },
  {
    code: "no_seatbelt",
    label: "No seatbelt",
    amount: 10000,
    points: 1,
    category: "safety",
  },
] as const;

export const CUSTOM_INFRACTION_TEMPLATE_CODE = "__custom__";

export function findInfractionTemplate(code: string): InfractionTemplate | null {
  if (!code || code === CUSTOM_INFRACTION_TEMPLATE_CODE) return null;
  return INFRACTION_TEMPLATES.find((template) => template.code === code) ?? null;
}

/** DB templates override built-ins by code; built-ins fill gaps until admin seeds them. */
export function mergeInfractionTemplateOptions(
  dbTemplates?: readonly Pick<
    InfractionTemplate,
    "code" | "label" | "amount" | "points" | "category"
  >[] | null
): InfractionTemplate[] {
  const byCode = new Map<string, InfractionTemplate>();
  for (const template of INFRACTION_TEMPLATES) {
    byCode.set(template.code, { ...template });
  }
  for (const row of dbTemplates ?? []) {
    byCode.set(row.code, {
      code: row.code,
      label: row.label,
      amount: Number(row.amount),
      points: Number(row.points),
      category: row.category,
    });
  }
  return Array.from(byCode.values()).sort((a, b) =>
    a.label.localeCompare(b.label, undefined, { sensitivity: "base" })
  );
}

