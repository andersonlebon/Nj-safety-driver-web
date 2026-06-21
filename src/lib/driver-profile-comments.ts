export type DriverProfileComment = {
  staffName: string | null;
  driverName: string | null;
  staffAvatar: string | null;
  commentMessage: string;
  timeSent: string;
};

export function parseDriverProfileComments(raw: unknown): DriverProfileComment[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const row = entry as Record<string, unknown>;
      const commentMessage = String(row.commentMessage ?? "").trim();
      const timeSent = String(row.timeSent ?? "");
      if (!commentMessage || !timeSent) return null;
      return {
        staffName:
          typeof row.staffName === "string" && row.staffName.trim()
            ? row.staffName.trim()
            : null,
        driverName:
          typeof row.driverName === "string" && row.driverName.trim()
            ? row.driverName.trim()
            : null,
        staffAvatar:
          typeof row.staffAvatar === "string" && row.staffAvatar.trim()
            ? row.staffAvatar.trim()
            : null,
        commentMessage,
        timeSent,
      } satisfies DriverProfileComment;
    })
    .filter((entry): entry is DriverProfileComment => entry !== null);
}

export function buildStaffProfileComment(
  staff: { full_name?: string | null; email?: string | null },
  message: string
): DriverProfileComment {
  return {
    staffName: staff.full_name?.trim() || staff.email?.trim() || "Staff member",
    driverName: null,
    staffAvatar: null,
    commentMessage: message.trim(),
    timeSent: new Date().toISOString(),
  };
}

export function buildDriverProfileComment(
  driver: { full_name?: string | null; email?: string | null },
  message: string
): DriverProfileComment {
  return {
    staffName: null,
    driverName: driver.full_name?.trim() || driver.email?.trim() || "Driver",
    staffAvatar: null,
    commentMessage: message.trim(),
    timeSent: new Date().toISOString(),
  };
}

export function commentSenderLabel(
  comment: DriverProfileComment,
  viewer: { role: "staff" | "driver"; displayName: string }
): string {
  if (comment.staffName) {
    if (
      viewer.role === "staff" &&
      comment.staffName.toLowerCase() === viewer.displayName.toLowerCase()
    ) {
      return "me";
    }
    return comment.staffName;
  }
  if (comment.driverName) {
    if (
      viewer.role === "driver" &&
      comment.driverName.toLowerCase() === viewer.displayName.toLowerCase()
    ) {
      return "me";
    }
    return comment.driverName;
  }
  return "Unknown";
}

export function commentInitials(comment: DriverProfileComment): string {
  const name = comment.staffName ?? comment.driverName ?? "?";
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}
