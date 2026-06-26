"use client";

import { useId, useState } from "react";

type AdminDateRangeFieldsProps = {
  startName: string;
  endName: string;
  startValue?: string | null;
  endValue?: string | null;
  startLabel?: string;
  endLabel?: string;
  startRequired?: boolean;
  endRequired?: boolean;
};

export function AdminDateRangeFields({
  startName,
  endName,
  startValue,
  endValue,
  startLabel = "开始日期（可选）",
  endLabel = "结束日期（可选）",
  startRequired = false,
  endRequired = false,
}: AdminDateRangeFieldsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <AdminDateField key={`${startName}-${startValue ?? ""}`} label={startLabel} name={startName} value={startValue ?? null} required={startRequired} />
      <AdminDateField key={`${endName}-${endValue ?? ""}`} label={endLabel} name={endName} value={endValue ?? null} required={endRequired} endDate />
    </div>
  );
}

function AdminDateField({
  label,
  name,
  value,
  required = false,
  endDate = false,
}: {
  label: string;
  name: string;
  value: string | null;
  required?: boolean;
  endDate?: boolean;
}) {
  const reactId = useId();
  const inputId = `${name}-${reactId}`;
  const [inputValue, setInputValue] = useState(toAdminDateInputValue(value, endDate));

  return (
    <div className="space-y-2 text-sm font-black text-slate-700">
      <label htmlFor={inputId}>
        {label} {required ? <span className="text-red-600">*</span> : null}
      </label>
      <div className="flex gap-2">
        <input
          id={inputId}
          name={name}
          type="date"
          value={inputValue}
          required={required}
          onChange={(event) => setInputValue(event.target.value)}
          className="h-12 min-w-0 flex-1 rounded-2xl border border-slate-200 px-4 text-sm font-bold text-slate-900 outline-none focus:border-blue-500"
        />
        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setInputValue("");
          }}
          className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:bg-slate-50"
        >
          清除
        </button>
      </div>
    </div>
  );
}

export function toAdminDateInputValue(value: string | null, endDate = false) {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const parts = datePartsInNewYork(date);
  if (endDate && parts.hour === 0 && parts.minute === 0 && parts.second === 0) {
    const previousDay = new Date(date.getTime() - 24 * 60 * 60 * 1000);
    return datePartsInNewYork(previousDay).date;
  }
  return parts.date;
}

function datePartsInNewYork(date: Date) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const parts = Object.fromEntries(formatter.formatToParts(date).map((part) => [part.type, part.value]));
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
  };
}
