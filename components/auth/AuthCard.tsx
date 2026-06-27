import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";

type AuthCardProps = {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  headerClassName?: string;
  titleClassName?: string;
  descriptionClassName?: string;
  contentClassName?: string;
};

export function AuthCard({ title, description, children, footer, className, headerClassName, titleClassName, descriptionClassName, contentClassName }: AuthCardProps) {
  return (
    <section className={cn("rounded-2xl border border-slate-100 bg-white p-4 shadow-sm", className)}>
      <div className={cn("space-y-1", headerClassName)}>
        <h1 className={cn("text-2xl font-black leading-tight text-slate-950", titleClassName)}>{title}</h1>
        <p className={cn("text-sm leading-6 text-slate-600", descriptionClassName)}>{description}</p>
      </div>
      <div className={cn("mt-5", contentClassName)}>{children}</div>
      {footer ? <div className="mt-5 border-t border-slate-100 pt-4 text-sm text-slate-600">{footer}</div> : null}
    </section>
  );
}

export function AuthLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="font-bold text-blue-700 underline-offset-4 hover:underline">
      {children}
    </Link>
  );
}
