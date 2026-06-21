"use client";

import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n/context";

export type TableFilterOption = { value: string; label: string };

type Props = {
  statusValue: string;
  onStatusChange: (value: string) => void;
  statusOptions?: TableFilterOption[];
  statusLabel?: string;
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  showDateFilters?: boolean;
  showStatus?: boolean;
  className?: string;
};

export function TableFilters({
  statusValue,
  onStatusChange,
  statusOptions = [],
  statusLabel,
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  showDateFilters = true,
  showStatus = true,
  className,
}: Props) {
  const { t } = useI18n();

  return (
    <>
      {showStatus && statusOptions.length > 0 && (
        <Select
          label={statusLabel ?? t("tables.status")}
          name="table_status_filter"
          value={statusValue}
          onChange={(e) => onStatusChange(e.target.value)}
          className={cn("min-w-0", className)}
        >
          <option value="">{t("tables.allStatuses")}</option>
          {statusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>
      )}
      {showDateFilters && (
        <>
          <Input
            label={t("tables.from")}
            name="table_date_from"
            type="date"
            value={dateFrom}
            onChange={(e) => onDateFromChange(e.target.value)}
            className={cn("min-w-0", className)}
          />
          <Input
            label={t("tables.to")}
            name="table_date_to"
            type="date"
            value={dateTo}
            onChange={(e) => onDateToChange(e.target.value)}
            className={cn("min-w-0", className)}
          />
        </>
      )}
    </>
  );
}
