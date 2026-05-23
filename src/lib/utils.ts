import clsx, { type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatCurrency(amount: number): string {
  // Central African CFA franc — Gabon's official currency.
  // We intentionally render the symbol as "FCFA" (the colloquial in-country
  // notation) instead of the ISO "XAF" because that's what users see on
  // receipts and tickets.
  const formatted = new Intl.NumberFormat("fr-FR", {
    style: "decimal",
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
  return `${formatted} FCFA`;
}

export function normalizePlate(plate: string): string {
  return plate.toUpperCase().replace(/\s+/g, "").trim();
}
