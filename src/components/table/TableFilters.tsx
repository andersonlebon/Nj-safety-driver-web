"use client";

import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";

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
};

export function TableFilters({
  statusValue,
  onStatusChange,
  statusOptions = [],
  statusLabel = "Status",
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  showDateFilters = true,
}: Props) {
  return (
    <>
      {statusOptions.length > 0 && (
        <Select
          label={statusLabel}
          name="table_status_filter"
          value={statusValue}
          onChange={(e) => onStatusChange(e.target.value)}
          className="min-w-[140px]"
        >
          <option value="">All statuses</option>
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
            label="From"
            name="table_date_from"
            type="date"
            value={dateFrom}
            onChange={(e) => onDateFromChange(e.target.value)}
            className="min-w-[140px]"
          />
          <Input
            label="To"
            name="table_date_to"
            type="date"
            value={dateTo}
            onChange={(e) => onDateToChange(e.target.value)}
            className="min-w-[140px]"
          />
        </>
      )}
    </>
  );
}
