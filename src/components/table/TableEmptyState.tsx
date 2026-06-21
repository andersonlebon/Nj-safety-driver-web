"use client";

import { EmptyState } from "@/components/ui/EmptyState";
import { useI18n } from "@/i18n/context";
import type { ReactNode } from "react";

type Props = {
  icon?: ReactNode;
  title: string;
  description?: string;
  filtered?: boolean;
  searchTerm?: string;
};

export function TableEmptyState({
  icon,
  title,
  description,
  filtered = false,
  searchTerm,
}: Props) {
  const { t } = useI18n();

  if (filtered) {
    return (
      <EmptyState
        icon={icon}
        title={t("tables.noMatchingRows")}
        description={
          searchTerm
            ? t("tables.noMatchForSearch", { searchTerm })
            : t("tables.clearFiltersHint")
        }
      />
    );
  }

  return <EmptyState icon={icon} title={title} description={description} />;
}
