"use client";

import { useId } from "react";
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
  const contactErrorId = useId();
  const set = (key: keyof ContactInput, next: string) => onChange({ ...value, [key]: next });

  return (
    <div className="space-y-4">
      <FormField label="联系人">
        <TextInput value={value.contact_name} onChange={(event) => set("contact_name", event.target.value)} placeholder="请输入联系人" />
      </FormField>

      <div role="group" aria-label="电话或微信（至少填写一项）" aria-describedby={errors.contact ? contactErrorId : undefined} data-field="contact" data-field-error={errors.contact ? "true" : undefined} tabIndex={-1} className="space-y-2 outline-none">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField label="联系电话" hint="与微信至少填写一项" fieldKey="phone" error={errors.phone}>
            <TextInput aria-invalid={Boolean(errors.phone || errors.contact)} aria-describedby={errors.contact ? contactErrorId : undefined} value={value.phone} onChange={(event) => set("phone", event.target.value)} placeholder="请输入联系电话" inputMode="tel" />
          </FormField>
          <FormField label="微信号" hint="与电话至少填写一项" fieldKey="wechat" error={errors.wechat}>
            <TextInput aria-invalid={Boolean(errors.wechat || errors.contact)} aria-describedby={errors.contact ? contactErrorId : undefined} value={value.wechat} onChange={(event) => set("wechat", event.target.value)} placeholder="请输入微信号" />
          </FormField>
        </div>

        {errors.contact ? <p id={contactErrorId} className="text-xs leading-5 text-red-600">{errors.contact}</p> : null}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FormField label="邮箱（可选）" fieldKey="email" error={errors.email}>
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
    </div>
  );
}
