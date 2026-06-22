import type { ReactNode } from "react";
import { AdminCard } from "./AdminCard";

export function AdminFilterBar({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <AdminCard title={title} description={description}>
      <div className="max-w-full overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{children}</div>
    </AdminCard>
  );
}
