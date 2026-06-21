"use client";

import { Input } from "@/components/ui/Input";
import { useI18n } from "@/i18n/context";

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
};

export function TableSearch({
  value,
  onChange,
  placeholder,
  label,
  className,
}: Props) {
  const { t } = useI18n();

  return (
    <Input
      label={label ?? t("tables.search")}
      name="table_search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder ?? t("tables.searchPlaceholder")}
      autoComplete="off"
      className={className}
    />
  );
}
