import { countryLabel, isDomesticCountry } from "@/lib/countries";
import { normalizePlate } from "@/lib/utils";

export function normalizePlateForCountry(plate: string, country: string): string {
  const trimmed = plate.trim();
  if (isDomesticCountry(country)) {
    return normalizePlate(trimmed);
  }
  return trimmed.toUpperCase().replace(/\s+/g, " ").trim();
}

export function formatPlateDisplay(
  plate: string,
  country: string | null | undefined
): string {
  const code = country ?? "GA";
  return `${plate} · ${countryLabel(code)}`;
}

export function isForeignVehicle(
  country: string | null | undefined,
  isForeign?: boolean | null
): boolean {
  return Boolean(isForeign) || !isDomesticCountry(country);
}
