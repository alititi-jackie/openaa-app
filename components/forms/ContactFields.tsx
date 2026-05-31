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
    <div className="space-y-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
      <div>
        <h2 className="text-base font-black text-slate-950">联系方式</h2>
        <p className="mt-1 text-xs leading-5 text-slate-500">列表页不会展示联系方式，详情页需点击查看后才读取。</p>
        {errors.contact ? <p className="mt-2 rounded-lg bg-rose-50 px-3 py-2 text-xs leading-5 text-rose-700">{errors.contact}</p> : null}
      </div>
      <FormField label="联系人">
        <TextInput value={value.contact_name} onChange={(event) => set("contact_name", event.target.value)} placeholder="例如：陈先生" />
      </FormField>
      <FormField label="联系电话" error={errors.phone}>
        <TextInput value={value.phone} onChange={(event) => set("phone", event.target.value)} placeholder="电话号码" inputMode="tel" />
      </FormField>
      <FormField label="微信">
        <TextInput value={value.wechat} onChange={(event) => set("wechat", event.target.value)} placeholder="微信号" />
      </FormField>
      <FormField label="邮箱">
        <TextInput value={value.email} onChange={(event) => set("email", event.target.value)} placeholder="email@example.com" inputMode="email" />
      </FormField>
      <FormField label="首选联系">
        <SelectInput value={value.preferred_contact_method} onChange={(event) => set("preferred_contact_method", event.target.value)}>
          <option value="phone">电话</option>
          <option value="wechat">微信</option>
          <option value="email">邮箱</option>
        </SelectInput>
      </FormField>
    </div>
  );
}
