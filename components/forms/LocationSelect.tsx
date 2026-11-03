"use client";

import type { SelectHTMLAttributes } from "react";
import { LOCATION_OPTIONS } from "@/features/posts/options";
import { SelectInput } from "./SelectInput";

type LocationSelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "value" | "onChange"> & {
  value?: string;
  onChange: (value: string) => void;
  required?: boolean;
};

export function LocationSelect({ value, onChange, required = true, ...props }: LocationSelectProps) {
  return (
    <SelectInput {...props} value={value ?? ""} onChange={(event) => onChange(event.target.value)} required={required}>
      <option value="" disabled>
        请选择地区
      </option>
      {LOCATION_OPTIONS.map((location) => (
        <option key={location.value} value={location.value}>
          {location.label}
        </option>
      ))}
    </SelectInput>
  );
}
