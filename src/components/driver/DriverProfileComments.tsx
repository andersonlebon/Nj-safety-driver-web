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
};

export function DriverProfileComments({
  driverProfileId,
  viewer,
  loadComments,
  sendComment,
  embedded = false,
}: Props) {
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
      setError("Write a comment before sending.");
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
      id="documents"
      className={cn(
        "scroll-mt-6",
        embedded ? "space-y-4" : "space-y-4 border-t border-stone-200 dark:border-slate-800 pt-4"
      )}
    >
      {!embedded && (
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-brand-600 dark:text-brand-400" />
          <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
            Chat with staff
          </h3>
        </div>
      )}

      <div className="rounded-lg border border-stone-200 dark:border-slate-800 bg-stone-50/40 dark:bg-slate-900/30">
        <div className="max-h-72 overflow-y-auto p-3 space-y-3">
          {loading ? (
            <p className="text-sm text-stone-500 dark:text-slate-400">Loading comments…</p>
          ) : comments.length === 0 ? (
            <p className="text-sm text-stone-500 dark:text-slate-400">
              No comments yet. Start the conversation with the driver here.
            </p>
          ) : (
            comments.map((comment, index) => {
              const isStaff = Boolean(comment.staffName);
              const label = commentSenderLabel(comment, viewer);
              const isMe = label === "me";

              return (
                <div
                  key={`${comment.timeSent}-${index}`}
                  className={cn(
                    "flex gap-3",
                    isMe ? "flex-row-reverse" : "flex-row"
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
                        isStaff
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
                      isMe
                        ? "bg-brand-600 text-white"
                        : "bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 text-stone-900 dark:text-stone-100"
                    )}
                  >
                    <div
                      className={cn(
                        "flex items-center gap-2 text-xs mb-1",
                        isMe ? "text-brand-100" : "text-stone-500 dark:text-slate-400"
                      )}
                    >
                      <span className="font-semibold capitalize">{label}</span>
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
          className="border-t border-stone-200 dark:border-slate-800 p-3 space-y-3"
        >
          {error && <Alert variant="error">{error}</Alert>}
          <Textarea
            label="Add a comment"
            name="profile_comment"
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ask for missing documents, clarify details, or leave a note for the driver…"
          />
          <div className="flex justify-end">
            <Button type="submit" loading={pending} className="text-sm py-2 px-3">
              <Send className="h-4 w-4 mr-1.5" />
              Send comment
            </Button>
          </div>
        </form>
      </div>
    </section>
  );
}
