"use client";

import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";

export function OnboardingHeader() {
  return (
    <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
      <LanguageSwitcher compact />
      <ThemeToggle size="sm" />
    </div>
  );
}
