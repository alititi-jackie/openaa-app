"use client";

import { useRouter } from "next/navigation";
import { SelectInput } from "@/components/forms/SelectInput";
import { PROFILE_POST_ALL_STATUS, PROFILE_POST_ALL_TYPE } from "@/features/posts/profileTabs";
import type { ProfilePostFilterOption, ProfilePostStatusFilterValue, ProfilePostTypeFilterValue } from "@/features/posts/profileTabs";

type ProfilePostFiltersProps = {
  typeOptions: ProfilePostFilterOption[];
  statusOptions: ProfilePostFilterOption[];
  selectedType: ProfilePostTypeFilterValue;
  selectedStatus: ProfilePostStatusFilterValue;
  path?: string;
  typeParamName?: string;
  preservedParams?: Record<string, string>;
  onTypeChange?: (value: ProfilePostTypeFilterValue) => void;
  onStatusChange?: (value: ProfilePostStatusFilterValue) => void;
};

export function ProfilePostFilters({
  typeOptions,
  statusOptions,
  selectedType,
  selectedStatus,
  path,
  typeParamName = "type",
  preservedParams,
  onTypeChange,
  onStatusChange,
}: ProfilePostFiltersProps) {
  const router = useRouter();

  function updateUrl(nextType: ProfilePostTypeFilterValue, nextStatus: ProfilePostStatusFilterValue) {
    if (!path) return;

    const params = new URLSearchParams(preservedParams);
    if (nextType !== PROFILE_POST_ALL_TYPE) params.set(typeParamName, nextType);
    else params.delete(typeParamName);
    if (nextStatus !== PROFILE_POST_ALL_STATUS) params.set("status", nextStatus);
    else params.delete("status");

    const query = params.toString();
    router.push(query ? `${path}?${query}` : path);
  }

  function handleTypeChange(value: ProfilePostTypeFilterValue) {
    onTypeChange?.(value);
    updateUrl(value, selectedStatus);
  }

  function handleStatusChange(value: ProfilePostStatusFilterValue) {
    onStatusChange?.(value);
    updateUrl(selectedType, value);
  }

  return (
    <form className="flex w-full items-center gap-2 sm:w-auto" aria-label="我的发布筛选">
      <label className="min-w-0 flex-1 sm:flex-none">
        <span className="sr-only">类型筛选</span>
        <SelectInput
          value={selectedType}
          onChange={(event) => handleTypeChange(event.target.value)}
          className="w-full text-base font-semibold sm:w-44"
        >
          {typeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </SelectInput>
      </label>

      <label className="min-w-0 flex-1 sm:flex-none">
        <span className="sr-only">状态筛选</span>
        <SelectInput
          value={selectedStatus}
          onChange={(event) => handleStatusChange(event.target.value as ProfilePostStatusFilterValue)}
          className="w-full text-base font-semibold sm:w-40"
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </SelectInput>
      </label>
    </form>
  );
}
