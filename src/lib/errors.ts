/**
 * Friendly error mapping for Supabase / Postgres / network failures.
 *
 * Raw Postgres errors like
 *   duplicate key value violates unique constraint "profiles_national_id_unique"
 * are useless (and a little scary) to end users. `friendlyError` accepts
 * anything the various Supabase SDKs throw or return — PostgrestError,
 * AuthError, StorageError, native Error, plain string, unknown — and turns
 * it into a short, user-facing sentence.
 *
 * This file MUST be safe to import from both Server Actions and Client
 * Components: no Node-only APIs, no Supabase clients, no React.
 */

const GENERIC_FALLBACK = "Something went wrong. Please try again.";

/**
 * Constraint name -> friendly per-field message. The constraint name is the
 * one Postgres puts inside the double quotes in the unique_violation message,
 * e.g. `profiles_national_id_unique`. Extend this table when you add a new
 * UNIQUE index that real users might collide on.
 */
const UNIQUE_CONSTRAINT_MESSAGES: Record<string, string> = {
  profiles_national_id_unique:
    "This National ID is already registered to another driver.",
  profiles_driver_license_unique:
    "This driver's license number is already registered.",
  profiles_email_key: "An account with that email already exists.",
  users_email_key: "An account with that email already exists.",
  vehicles_plate_number_unique:
    "This plate number is already registered.",
  vehicles_plate_country_unique:
    "This plate is already registered for that country.",
  profiles_user_id_unique:
    "This account already has a profile.",
  profiles_user_id_role_unique:
    "You already have a profile of this type on your account.",
  vehicles_pkey:
    "This vehicle was already registered during a previous attempt. Please try finalizing again.",
  documents_pkey: "This document has already been uploaded.",
};

/**
 * Column name -> friendly label. Used by not-null violations and as a
 * fallback for unique violations when we can extract a column from `details`
 * but the constraint name isn't in the map above.
 */
const COLUMN_LABELS: Record<string, string> = {
  national_id: "National ID",
  driver_license: "Driver's license",
  full_name: "Full name",
  phone: "Phone number",
  address: "Address",
  email: "Email",
  password: "Password",
  plate_number: "Plate number",
  brand: "Brand",
  model: "Model",
  color: "Color",
  year: "Year",
  fine_amount: "Fine amount",
  infraction_type: "Infraction type",
  doc_type: "Document type",
  file_path: "File",
  file_name: "File name",
  role: "Role",
};

type AnyRecord = Record<string, unknown>;

function isRecord(value: unknown): value is AnyRecord {
  return typeof value === "object" && value !== null;
}

function getString(value: unknown, key: string): string | undefined {
  if (!isRecord(value)) return undefined;
  const v = value[key];
  return typeof v === "string" ? v : undefined;
}

/**
 * Extract the constraint name (the bit between double quotes) from a
 * unique_violation message. Returns `undefined` if no quoted token is found.
 */
function extractConstraintName(message: string): string | undefined {
  const match = message.match(/"([^"]+)"/);
  return match?.[1];
}

/**
 * Extract the column name from a Postgres `details` payload like
 *   Key (national_id)=(545555) already exists.
 * Returns `undefined` if no `(column)=` pattern is found.
 */
function extractColumnFromDetails(details: string): string | undefined {
  const match = details.match(/Key \(([^)]+)\)=/);
  if (!match) return undefined;
  // Could be a composite key like "(a, b)". Take the first column only.
  return match[1].split(",")[0].trim();
}

/**
 * Extract the column name from a not-null violation message like
 *   null value in column "national_id" of relation "profiles" violates not-null constraint
 */
function extractColumnFromNotNull(message: string): string | undefined {
  const match = message.match(/column "([^"]+)"/);
  return match?.[1];
}

function labelFor(column: string): string {
  return (
    COLUMN_LABELS[column] ??
    column
      .replace(/_/g, " ")
      .replace(/^\w/, (c) => c.toUpperCase())
  );
}

/**
 * True if the error looks like a Postgres unique_violation (23505). Useful
 * for callers that want to special-case duplicate-key handling without
 * re-parsing the message.
 */
export function isUniqueViolation(err: unknown): boolean {
  if (!isRecord(err)) return false;
  if (err.code === "23505") return true;
  const message = getString(err, "message") ?? "";
  return /duplicate key value violates unique constraint/i.test(message);
}

function handleUniqueViolation(err: AnyRecord): string {
  const details = getString(err, "details") ?? "";
  const message = getString(err, "message") ?? "";

  const constraintName = extractConstraintName(message);
  if (constraintName && UNIQUE_CONSTRAINT_MESSAGES[constraintName]) {
    return UNIQUE_CONSTRAINT_MESSAGES[constraintName];
  }

  const column = extractColumnFromDetails(details);
  if (column) {
    return `This ${labelFor(column).toLowerCase()} is already in use.`;
  }

  return "A record with the same value already exists.";
}

function handlePostgresCode(err: AnyRecord, code: string): string | undefined {
  const message = getString(err, "message") ?? "";

  switch (code) {
    case "23505":
      return handleUniqueViolation(err);
    case "23503":
      return "The referenced record was not found or has been deleted.";
    case "23502": {
      const column = extractColumnFromNotNull(message);
      if (column) return `${labelFor(column)} is required.`;
      return "A required field is missing.";
    }
    case "23514":
      return "The value provided does not meet the required format.";
    case "42501":
      return "You do not have permission to perform this action.";
    case "22P02":
      return "One of the values has an invalid format.";
    case "PGRST301":
      return "You do not have permission to access this resource.";
    default:
      return undefined;
  }
}

function handleAuthMessage(message: string): string | undefined {
  const lower = message.toLowerCase();

  if (lower.includes("invalid login credentials")) {
    return "The email or password is incorrect. If you just registered, confirm your email first.";
  }
  if (
    lower.includes("email not confirmed") ||
    lower.includes("email address not confirmed") ||
    lower.includes("email_not_confirmed")
  ) {
    return "Please confirm your email before signing in.";
  }
  if (
    lower.includes("user already registered") ||
    (lower.includes("duplicate") && lower.includes("auth.users"))
  ) {
    return "An account with that email already exists. Try signing in instead.";
  }
  if (lower.includes("password should be at least")) {
    return "Your password must be at least 8 characters.";
  }
  if (lower.includes("jwt") || lower.includes("session")) {
    return "Your session expired. Please sign in again.";
  }
  return undefined;
}

function handleStorageMessage(message: string): string | undefined {
  const lower = message.toLowerCase();

  if (lower.includes("the resource already exists")) {
    return "A file with that name already exists. Try renaming it.";
  }
  if (lower.includes("payload too large") || lower.includes("413")) {
    return "This file is too large. Maximum size is 10 MB.";
  }
  if (lower.includes("mime type not supported") || lower.includes("415")) {
    return "This file type is not supported.";
  }
  return undefined;
}

function handleNetworkMessage(name: string, message: string): string | undefined {
  const lower = message.toLowerCase();

  if (name === "AbortError" || lower.includes("aborterror")) {
    return "Network problem. Please check your connection and try again.";
  }
  if (
    lower.includes("fetch failed") ||
    lower.includes("networkerror") ||
    lower.includes("network error") ||
    lower.includes("failed to fetch") ||
    lower.includes("econnrefused") ||
    lower.includes("etimedout") ||
    lower.includes("enotfound")
  ) {
    return "Network problem. Please check your connection and try again.";
  }
  return undefined;
}

/**
 * Map any error-ish value into a short, safe, user-friendly sentence.
 *
 * The raw input is NEVER surfaced verbatim. If we can't recognize the error
 * we fall back to a generic message rather than leaking internals like
 * constraint names, schema names, or stack traces.
 */
export function friendlyError(err: unknown): string {
  if (err == null) return GENERIC_FALLBACK;

  if (typeof err === "string") {
    const trimmed = err.trim();
    if (!trimmed) return GENERIC_FALLBACK;
    return (
      handleAuthMessage(trimmed) ??
      handleStorageMessage(trimmed) ??
      handleNetworkMessage("", trimmed) ??
      GENERIC_FALLBACK
    );
  }

  if (!isRecord(err)) return GENERIC_FALLBACK;

  const code = getString(err, "code");
  const message = getString(err, "message") ?? "";
  const name = getString(err, "name") ?? "";

  if (code) {
    const fromCode = handlePostgresCode(err, code);
    if (fromCode) return fromCode;
  }

  if (
    !code &&
    /duplicate key value violates unique constraint/i.test(message)
  ) {
    return handleUniqueViolation(err);
  }

  const fromAuth = handleAuthMessage(message);
  if (fromAuth) return fromAuth;

  const fromStorage = handleStorageMessage(message);
  if (fromStorage) return fromStorage;

  const fromNetwork = handleNetworkMessage(name, message);
  if (fromNetwork) return fromNetwork;

  const lower = message.toLowerCase();
  if (lower.includes("user_id") && lower.includes("column")) {
    return "Database setup is incomplete. Run npm run db:push on production, then retry /setup.";
  }
  if (lower.includes("profile_types") && lower.includes("column")) {
    return "Database setup is incomplete. Run npm run db:push on production, then retry /setup.";
  }
  if (
    lower.includes("is_border_transit") ||
    lower.includes("border_checkpoint") ||
    lower.includes("registration_country")
  ) {
    return "Border transit database setup is incomplete. An admin must run npm run db:push on production.";
  }

  if (typeof code === "string" && /^4\d\d$|^5\d\d$/.test(code)) {
    if (code === "404") return "We couldn't find what you were looking for.";
    if (code === "401" || code === "403") {
      return "You do not have permission to perform this action.";
    }
    if (code.startsWith("5")) {
      return "The server is having trouble right now. Please try again in a moment.";
    }
  }

  return GENERIC_FALLBACK;
}
