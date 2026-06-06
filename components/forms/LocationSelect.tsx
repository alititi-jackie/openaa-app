"use client";

import { LOCATION_OPTIONS } from "@/features/posts/formMappers";
import { SelectInput } from "./SelectInput";

type LocationSelectProps = {
  value?: string;
  onChange: (value: string) => void;
};

export function LocationSelect({ value, onChange }: LocationSelectProps) {
  return (
    <SelectInput value={value ?? ""} onChange={(event) => onChange(event.target.value)} required>
      <option value="" disabled>
        请选择地区
      </option>
      {LOCATION_OPTIONS.map((location) => (
        <option key={location} value={location}>
          {location}
        </option>
      ))}
    </SelectInput>
  );
}
