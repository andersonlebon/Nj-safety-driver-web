/**
 * Driver compliance score: insurance-style road status.
 * Points are snapshotted on each infraction and never restored when paid.
 */

export const COMPLIANCE_RULES = {
  minimumAllowedToDrive: 40,
  /** Fallback when legacy infraction rows have no points column value. */
  defaultInfractionPoints: 2,
} as const;

export const COMPLIANCE_LOCK_ADMIN_MESSAGE =
  "Your compliance score dropped below 40. Your driver profile is locked until staff review.";

export type ComplianceInfraction = {
  points?: number | null;
};

export function sumInfractionPoints(infractions: ComplianceInfraction[]): number {
  return infractions.reduce((sum, row) => {
    const pts = row.points ?? COMPLIANCE_RULES.defaultInfractionPoints;
    return sum + Math.max(0, Number(pts) || 0);
  }, 0);
}

/** 0–100 score: 100 minus the sum of per-infraction template points. */
export function computeComplianceScore(
  infractions: ComplianceInfraction[]
): number {
  const deducted = sumInfractionPoints(infractions);
  return Math.max(0, Math.min(100, 100 - deducted));
}

export function isComplianceScoreLocked(score: number): boolean {
  return score < COMPLIANCE_RULES.minimumAllowedToDrive;
}
