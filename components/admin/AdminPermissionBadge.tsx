import { ShieldCheck, ShieldX } from "lucide-react";
import { getAdminPermissionLabel } from "@/features/admins/adminRoleConfig";

export function AdminPermissionBadge({ allowed, label }: { allowed: boolean; label: string }) {
  const Icon = allowed ? ShieldCheck : ShieldX;
  const displayLabel = getAdminPermissionLabel(label);

  return (
    <span
      className={
        allowed
          ? "inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700"
          : "inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600"
      }
    >
      <Icon size={13} aria-hidden="true" />
      {displayLabel}
    </span>
  );
}
