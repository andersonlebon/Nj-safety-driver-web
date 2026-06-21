"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n/context";

export type DriverProfileTabId = "profile" | "files" | "documents";

function tabFromHash(hash: string): DriverProfileTabId {
  const value = hash.replace(/^#/, "").trim();
  if (value === "files") return "files";
  if (value === "documents") return "documents";
  return "profile";
}

type Props = {
  personalInfo: ReactNode;
  documents: ReactNode;
  comments: ReactNode;
};

export function DriverProfilePageTabs({
  personalInfo,
  documents,
  comments,
}: Props) {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<DriverProfileTabId>("profile");

  const tabs = useMemo(
    () =>
      [
        { id: "profile" as const, label: t("driver.profile.tabs.personalInfo"), hash: "profile" },
        { id: "files" as const, label: t("driver.profile.tabs.documents"), hash: "files" },
        { id: "documents" as const, label: t("driver.profile.tabs.chat"), hash: "documents" },
      ] as const,
    [t]
  );

  useEffect(() => {
    const syncFromHash = () => {
      setActiveTab(tabFromHash(window.location.hash));
    };

    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);
    return () => window.removeEventListener("hashchange", syncFromHash);
  }, []);

  const selectTab = (tab: DriverProfileTabId) => {
    setActiveTab(tab);
    const hash = tabs.find((item) => item.id === tab)?.hash ?? "profile";
    const url = `${window.location.pathname}${window.location.search}#${hash}`;
    window.history.replaceState(null, "", url);
  };

  return (
    <div className="space-y-6">
      <div
        role="tablist"
        aria-label={t("driver.profile.tabs.ariaLabel")}
        className="flex flex-wrap gap-2 border-b border-stone-200 dark:border-slate-800 pb-2"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => selectTab(tab.id)}
            className={cn(
              "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              activeTab === tab.id
                ? "bg-brand-700 text-white shadow-sm"
                : "bg-stone-100 text-stone-700 hover:bg-stone-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div role="tabpanel">
        {activeTab === "profile" && personalInfo}
        {activeTab === "files" && documents}
        {activeTab === "documents" && comments}
      </div>
    </div>
  );
}
