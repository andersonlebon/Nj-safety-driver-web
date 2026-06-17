import { EmptyState } from "@/components/ui/EmptyState";
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
  if (filtered) {
    return (
      <EmptyState
        icon={icon}
        title="No matching rows"
        description={
          searchTerm
            ? `Nothing matches "${searchTerm}". Try clearing filters.`
            : "Try clearing filters or adjusting your search."
        }
      />
    );
  }

  return <EmptyState icon={icon} title={title} description={description} />;
}
