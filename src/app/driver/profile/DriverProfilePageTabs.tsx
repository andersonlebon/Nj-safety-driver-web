"use client";

import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export type DriverProfileTabId = "profile" | "files" | "documents";

const TABS: { id: DriverProfileTabId; label: string; hash: string }[] = [
  { id: "profile", label: "Personal info", hash: "profile" },
  { id: "files", label: "Documents", hash: "files" },
  { id: "documents", label: "Chat with staff", hash: "documents" },
];

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
  const [activeTab, setActiveTab] = useState<DriverProfileTabId>("profile");

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
    const hash = TABS.find((item) => item.id === tab)?.hash ?? "profile";
    const url = `${window.location.pathname}${window.location.search}#${hash}`;
    window.history.replaceState(null, "", url);
  };

  return (
    <div className="space-y-6">
      <div
        role="tablist"
        aria-label="Profile sections"
        className="flex flex-wrap gap-2 border-b border-stone-200 dark:border-slate-800 pb-2"
      >
        {TABS.map((tab) => (
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
