"use client";

import type { ContactInput, PostFormErrors } from "@/features/posts/formTypes";
import { FormField } from "./FormField";
import { SelectInput } from "./SelectInput";
import { TextInput } from "./TextInput";

type ContactFieldsProps = {
  value: ContactInput;
  errors: PostFormErrors;
  onChange: (value: ContactInput) => void;
};

export function ContactFields({ value, errors, onChange }: ContactFieldsProps) {
  const set = (key: keyof ContactInput, next: string) => onChange({ ...value, [key]: next });

  return (
    <div className="space-y-4">
      <FormField label="联系人">
        <TextInput value={value.contact_name} onChange={(event) => set("contact_name", event.target.value)} placeholder="请输入联系人" />
      </FormField>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FormField label="联系电话" hint="与微信至少填写一项" error={errors.phone}>
          <TextInput value={value.phone} onChange={(event) => set("phone", event.target.value)} placeholder="请输入联系电话" inputMode="tel" />
        </FormField>
        <FormField label="微信号" hint="与电话至少填写一项" error={errors.wechat}>
          <TextInput value={value.wechat} onChange={(event) => set("wechat", event.target.value)} placeholder="请输入微信号" />
        </FormField>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FormField label="邮箱（可选）" error={errors.email}>
          <TextInput value={value.email} onChange={(event) => set("email", event.target.value)} placeholder="email@example.com" inputMode="email" />
        </FormField>
        <FormField label="首选联系方式">
          <SelectInput value={value.preferred_contact_method} onChange={(event) => set("preferred_contact_method", event.target.value)}>
            <option value="">未指定</option>
            <option value="phone">手机</option>
            <option value="wechat">微信</option>
            <option value="email">邮箱</option>
          </SelectInput>
        </FormField>
      </div>

      {errors.contact ? (
        <div className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm leading-5 text-red-600">
          {errors.contact}
        </div>
      ) : null}
    </div>
  );
}
