"use client";

import { Input } from "@/components/ui/Input";

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
  placeholder = "Search…",
  label = "Search",
  className,
}: Props) {
  return (
    <Input
      label={label}
      name="table_search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoComplete="off"
      className={className}
    />
  );
}
