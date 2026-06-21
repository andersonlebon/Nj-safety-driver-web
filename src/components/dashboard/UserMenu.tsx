"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { LogOut, User, UserPlus, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n/context";
import type { ProfileSwitcherMode } from "@/lib/auth/user-menu-profile";

function initials(name: string | null | undefined, email: string | null | undefined) {
  const source = name?.trim() || email?.trim() || "?";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

function AvatarContent({
  avatarUrl,
  userName,
  userEmail,
  size = "md",
}: {
  avatarUrl?: string | null;
  userName?: string | null;
  userEmail?: string | null;
  size?: "md" | "lg";
}) {
  const label = initials(userName, userEmail);
  const sizeClass = size === "lg" ? "h-12 w-12 text-sm" : "h-10 w-10 text-sm";

  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt=""
        className={cn("rounded-full object-cover", sizeClass)}
      />
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full font-semibold",
        "bg-stone-100 text-stone-700 dark:bg-slate-800 dark:text-stone-100",
        sizeClass
      )}
      aria-hidden
    >
      {label}
    </span>
  );
}

export function UserMenu({
  userName,
  userEmail,
  roleLabel,
  accountHref,
  avatarUrl,
  profileSwitcherMode,
}: {
  userName?: string | null;
  userEmail?: string | null;
  roleLabel: string;
  accountHref: string;
  avatarUrl?: string | null;
  profileSwitcherMode?: ProfileSwitcherMode | null;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [menuStyle, setMenuStyle] = useState<{ top: number; left: number } | null>(
    null
  );
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  const displayName = userName?.trim() || userEmail || t("common.user");
  const profileSwitcherLabel =
    profileSwitcherMode === "switch"
      ? t("userMenu.switchProfile")
      : profileSwitcherMode === "add-driver"
        ? t("userMenu.addDriverProfile")
        : null;
  const ProfileSwitcherIcon =
    profileSwitcherMode === "add-driver" ? UserPlus : Users;

  useEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) {
      setMenuStyle(null);
      return;
    }

    const updatePosition = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const menuWidth = 256;
      const gap = 8;
      const left = Math.min(
        Math.max(8, rect.right - menuWidth),
        window.innerWidth - menuWidth - 8
      );
      setMenuStyle({ top: rect.bottom + gap, left });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target)) return;
      const menu = document.getElementById(menuId);
      if (menu?.contains(target)) return;
      setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, menuId]);

  const dropdown =
    open && mounted && menuStyle
      ? createPortal(
          <div
            id={menuId}
            role="menu"
            style={{ top: menuStyle.top, left: menuStyle.left }}
            className={cn(
              "fixed z-[300] w-64 overflow-hidden rounded-xl border shadow-luxury",
              "border-stone-200/80 bg-white/95 backdrop-blur-md dark:border-slate-700/80 dark:bg-slate-900/95"
            )}
          >
            <div className="flex gap-3 border-b border-stone-200 px-4 py-3 dark:border-slate-800">
              <AvatarContent
                avatarUrl={avatarUrl}
                userName={userName}
                userEmail={userEmail}
                size="lg"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-stone-900 dark:text-stone-100">
                  {displayName}
                </p>
                {userEmail && (
                  <p className="truncate text-xs text-stone-500 dark:text-slate-400">
                    {userEmail}
                  </p>
                )}
                <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-stone-400 dark:text-slate-500">
                  {roleLabel}
                </p>
              </div>
            </div>

            <div className="py-1">
              <Link
                href={accountHref}
                role="menuitem"
                className="flex items-center gap-2 px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 dark:text-slate-200 dark:hover:bg-slate-800/80"
                onClick={() => setOpen(false)}
              >
                <User className="h-4 w-4 shrink-0 text-stone-500 dark:text-slate-400" />
                {t("userMenu.account")}
              </Link>
              {profileSwitcherMode && profileSwitcherLabel && (
                <Link
                  href="/profile"
                  role="menuitem"
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 dark:text-slate-200 dark:hover:bg-slate-800/80"
                  onClick={() => setOpen(false)}
                >
                  <ProfileSwitcherIcon className="h-4 w-4 shrink-0 text-stone-500 dark:text-slate-400" />
                  {profileSwitcherLabel}
                </Link>
              )}
            </div>

            <div className="border-t border-stone-200 py-1 dark:border-slate-800">
              <form action="/signout" method="POST">
                <button
                  type="submit"
                  role="menuitem"
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-red-700 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950/30"
                >
                  <LogOut className="h-4 w-4 shrink-0" />
                  {t("common.signOut")}
                </button>
              </form>
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={cn(
          "flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border transition-colors",
          "border-stone-200 hover:opacity-90 dark:border-slate-700",
          open && "ring-2 ring-brand-600/30 dark:ring-brand-400/30"
        )}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
      >
        <AvatarContent avatarUrl={avatarUrl} userName={userName} userEmail={userEmail} />
        <span className="sr-only">{displayName}</span>
      </button>
      {dropdown}
    </>
  );
}
