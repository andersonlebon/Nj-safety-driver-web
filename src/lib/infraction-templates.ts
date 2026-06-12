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

export function findInfractionTemplate(code: string): InfractionTemplate | null {
  return INFRACTION_TEMPLATES.find((template) => template.code === code) ?? null;
}

