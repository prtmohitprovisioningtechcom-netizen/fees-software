"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";

/** Normalize typed dates (DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD) to YYYY-MM-DD */
export function parseFlexibleDate(text: string): string {
  const raw = text.trim();
  if (!raw) return "";

  const iso = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (iso) {
    const [, y, m, d] = iso;
    const date = new Date(Number(y), Number(m) - 1, Number(d));
    if (!isNaN(date.getTime())) {
      return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
    }
  }

  const dmy = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dmy) {
    const [, d, m, y] = dmy;
    const date = new Date(Number(y), Number(m) - 1, Number(d));
    if (!isNaN(date.getTime())) {
      return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
    }
  }

  return raw;
}

type FlexibleDateInputProps = {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
};

/** Calendar picker + free-type field (DD/MM/YYYY or YYYY-MM-DD). */
export function FlexibleDateInput({
  value = "",
  onChange,
  placeholder = "DD/MM/YYYY",
  disabled,
}: FlexibleDateInputProps) {
  const [text, setText] = useState(value);

  useEffect(() => {
    setText(value || "");
  }, [value]);

  const isoValue = (() => {
    const parsed = parseFlexibleDate(value || "");
    return /^\d{4}-\d{2}-\d{2}$/.test(parsed) ? parsed : "";
  })();

  return (
    <div className="flex gap-2">
      <Input
        type="text"
        value={text}
        disabled={disabled}
        placeholder={placeholder}
        className="flex-1"
        onChange={(e) => {
          const next = e.target.value;
          setText(next);
          onChange(parseFlexibleDate(next));
        }}
        onBlur={() => {
          const parsed = parseFlexibleDate(text);
          if (parsed && /^\d{4}-\d{2}-\d{2}$/.test(parsed)) {
            setText(parsed);
            onChange(parsed);
          }
        }}
      />
      <Input
        type="date"
        value={isoValue}
        disabled={disabled}
        className="w-[9.5rem] shrink-0"
        title="Open calendar"
        onChange={(e) => {
          const next = e.target.value;
          setText(next);
          onChange(next);
        }}
      />
    </div>
  );
}
