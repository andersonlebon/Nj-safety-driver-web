/** ISO 3166-1 alpha-2 codes for CEMAC / neighbouring states + common transit origins */
export const COUNTRIES = [
  { code: "GA", name: "Gabon", flag: "🇬🇦" },
  { code: "CM", name: "Cameroon", flag: "🇨🇲" },
  { code: "CG", name: "Congo", flag: "🇨🇬" },
  { code: "CD", name: "DR Congo", flag: "🇨🇩" },
  { code: "GQ", name: "Equatorial Guinea", flag: "🇬🇶" },
  { code: "CF", name: "Central African Rep.", flag: "🇨🇫" },
  { code: "TD", name: "Chad", flag: "🇹🇩" },
  { code: "NG", name: "Nigeria", flag: "🇳🇬" },
  { code: "FR", name: "France", flag: "🇫🇷" },
  { code: "OTHER", name: "Other", flag: "🌍" },
] as const;

export type CountryCode = (typeof COUNTRIES)[number]["code"];

export const DEFAULT_COUNTRY: CountryCode = "GA";

export const BORDER_CHECKPOINTS = [
  "Mvengé — Cameroon border",
  "Ntam — Cameroon border",
  "Doussala — Congo border",
  "Libreville port",
  "Owendo port",
  "Léon Mba International Airport",
  "Other checkpoint",
] as const;

export type BorderCheckpoint = (typeof BORDER_CHECKPOINTS)[number];

export function countryByCode(code: string | null | undefined) {
  return COUNTRIES.find((c) => c.code === code) ?? COUNTRIES.find((c) => c.code === "OTHER")!;
}

export function countryLabel(code: string | null | undefined): string {
  return countryByCode(code).name;
}

export function countryFlag(code: string | null | undefined): string {
  return countryByCode(code).flag;
}

export function isDomesticCountry(code: string | null | undefined): boolean {
  return (code ?? DEFAULT_COUNTRY) === "GA";
}
