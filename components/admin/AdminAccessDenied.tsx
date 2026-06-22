import type { ReactNode } from "react";
import { AdminPermissionBadge } from "./AdminPermissionBadge";

export function AdminAccessDenied({
  title,
  message,
  permission,
  children,
}: {
  title: string;
  message: string;
  permission?: string;
  children?: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-black text-amber-950">{title}</h2>
          <p className="mt-1 font-semibold">{message}</p>
        </div>
        {permission ? <AdminPermissionBadge allowed={false} label={permission} /> : null}
      </div>
      {children ? <div className="mt-3 flex flex-wrap gap-2">{children}</div> : null}
    </section>
  );
}
