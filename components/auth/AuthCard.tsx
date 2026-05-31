import type { ReactNode } from "react";
import Link from "next/link";

type AuthCardProps = {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthCard({ title, description, children, footer }: AuthCardProps) {
  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="space-y-1">
        <h1 className="text-2xl font-black leading-tight text-slate-950">{title}</h1>
        <p className="text-sm leading-6 text-slate-600">{description}</p>
      </div>
      <div className="mt-5">{children}</div>
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
