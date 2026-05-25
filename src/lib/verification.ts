import type { Database } from "@/lib/types/database";

export type VerificationStatus =
  Database["public"]["Enums"]["verification_status"];

export const VERIFICATION_LABELS: Record<VerificationStatus, string> = {
  pending_documents: "Documents missing",
  pending_review: "Pending review",
  active: "Active",
  rejected: "Rejected",
};

export function isProfileActive(
  status: VerificationStatus | null | undefined
): boolean {
  return status === "active";
}

export function profileStatusVariant(
  status: VerificationStatus | null | undefined
): "warning" | "success" | "error" | "neutral" {
  switch (status) {
    case "active":
      return "success";
    case "rejected":
      return "error";
    case "pending_review":
      return "warning";
    default:
      return "neutral";
  }
}

export function documentExpiryState(expiresAt: string | null | undefined): {
  label: string;
  variant: "success" | "warning" | "error" | "neutral";
} {
  if (!expiresAt) {
    return { label: "No expiry date", variant: "neutral" };
  }
  const expiry = new Date(expiresAt);
  const now = new Date();
  const days = Math.ceil(
    (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (days < 0) {
    return { label: `Expired ${Math.abs(days)} day(s) ago`, variant: "error" };
  }
  if (days <= 30) {
    return { label: `Expires in ${days} day(s)`, variant: "warning" };
  }
  return { label: `Valid until ${expiry.toLocaleDateString()}`, variant: "success" };
}
