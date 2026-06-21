"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { MessageSquare, Send } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { Alert } from "@/components/ui/Alert";
import {
  commentInitials,
  commentSenderLabel,
  type DriverProfileComment,
} from "@/lib/driver-profile-comments";
import { formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n/context";

type Viewer = {
  role: "staff" | "driver";
  displayName: string;
};

type Props = {
  driverProfileId: string;
  viewer: Viewer;
  loadComments: (driverProfileId: string) => Promise<DriverProfileComment[]>;
  sendComment: (
    driverProfileId: string,
    message: string
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
  embedded?: boolean;
  /** Fill available height (e.g. inside a fixed-height modal tab). */
  fillHeight?: boolean;
};

function commentAlignEnd(
  comment: DriverProfileComment,
  viewer: Viewer
): boolean {
  const isStaffMessage = Boolean(comment.staffName);
  return viewer.role === "staff" ? isStaffMessage : !isStaffMessage;
}

export function DriverProfileComments({
  driverProfileId,
  viewer,
  loadComments,
  sendComment,
  embedded = false,
  fillHeight = false,
}: Props) {
  const { t } = useI18n();
  const [comments, setComments] = useState<DriverProfileComment[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, startTransition] = useTransition();

  const refresh = useCallback(async () => {
    setLoading(true);
    const rows = await loadComments(driverProfileId);
    setComments(rows);
    setLoading(false);
  }, [driverProfileId, loadComments]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = message.trim();
    if (!trimmed) {
      setError(t("driver.profile.chat.errorEmpty"));
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await sendComment(driverProfileId, trimmed);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setMessage("");
      await refresh();
    });
  };

  return (
    <section
      className={cn(
        "scroll-mt-6",
        fillHeight && "flex flex-col min-h-0 h-full",
        embedded ? "space-y-0" : "space-y-4 border-t border-stone-200 dark:border-slate-800 pt-4"
      )}
    >
      {!embedded && (
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="h-4 w-4 text-brand-600 dark:text-brand-400" />
          <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
            {t("driver.profile.chat.title")}
          </h3>
        </div>
      )}

      <div
        className={cn(
          "rounded-lg border border-stone-200 dark:border-slate-800 bg-stone-50/40 dark:bg-slate-900/30 flex flex-col",
          fillHeight && "flex-1 min-h-0"
        )}
      >
        <div
          className={cn(
            "overflow-y-auto p-3 space-y-3",
            fillHeight ? "flex-1 min-h-0" : "max-h-72"
          )}
        >
          {loading ? (
            <div className="animate-pulse space-y-3" aria-label={t("driver.profile.chat.loadingAria")}>
              <div className="flex gap-3">
                <div className="h-9 w-9 shrink-0 rounded-full bg-stone-200 dark:bg-slate-800" />
                <div className="h-14 flex-1 max-w-[70%] rounded-xl bg-stone-100 dark:bg-slate-800/70" />
              </div>
              <div className="flex flex-row-reverse gap-3">
                <div className="h-9 w-9 shrink-0 rounded-full bg-stone-200 dark:bg-slate-800" />
                <div className="h-12 flex-1 max-w-[60%] rounded-xl bg-stone-100 dark:bg-slate-800/70" />
              </div>
            </div>
          ) : comments.length === 0 ? (
            <p className="text-sm text-stone-500 dark:text-slate-400">
              {t("driver.profile.chat.empty")}
            </p>
          ) : (
            comments.map((comment, index) => {
              const isStaffMessage = Boolean(comment.staffName);
              const label = commentSenderLabel(comment, viewer);
              const displayLabel =
                label === "me" ? t("driver.profile.chat.senderYou") : label;
              const alignEnd = commentAlignEnd(comment, viewer);

              return (
                <div
                  key={`${comment.timeSent}-${index}`}
                  className={cn(
                    "flex gap-3",
                    alignEnd ? "flex-row-reverse" : "flex-row"
                  )}
                >
                  {comment.staffAvatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={comment.staffAvatar}
                      alt=""
                      className="h-9 w-9 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <span
                      className={cn(
                        "h-9 w-9 shrink-0 rounded-full grid place-items-center text-xs font-semibold",
                        isStaffMessage
                          ? "bg-brand-100 text-brand-800 dark:bg-brand-950/50 dark:text-brand-200"
                          : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200"
                      )}
                    >
                      {commentInitials(comment)}
                    </span>
                  )}
                  <div
                    className={cn(
                      "min-w-0 max-w-[85%] rounded-xl px-3 py-2 text-sm",
                      alignEnd
                        ? "bg-brand-600 text-white"
                        : "bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 text-stone-900 dark:text-stone-100"
                    )}
                  >
                    <div
                      className={cn(
                        "flex items-center gap-2 text-xs mb-1",
                        alignEnd
                          ? "text-brand-100"
                          : "text-stone-500 dark:text-slate-400"
                      )}
                    >
                      <span className="font-semibold">{displayLabel}</span>
                      <span>{formatDateTime(comment.timeSent)}</span>
                    </div>
                    <p className="whitespace-pre-wrap break-words">
                      {comment.commentMessage}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <form
          onSubmit={handleSubmit}
          className="shrink-0 border-t border-stone-200 dark:border-slate-800 p-3 space-y-3"
        >
          {error && <Alert variant="error">{error}</Alert>}
          <Textarea
            label={t("driver.profile.chat.formLabel")}
            name="profile_comment"
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t("driver.profile.chat.formPlaceholder")}
          />
          <div className="flex justify-end">
            <Button type="submit" loading={pending} className="text-sm py-2 px-3">
              <Send className="h-4 w-4 mr-1.5" />
              {t("driver.profile.chat.formSend")}
            </Button>
          </div>
        </form>
      </div>
    </section>
  );
}
