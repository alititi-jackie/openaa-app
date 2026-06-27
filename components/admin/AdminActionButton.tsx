import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

export type AdminActionButtonVariant = "neutral" | "primary" | "primarySoft" | "success" | "warning" | "danger" | "dangerSoft" | "solidDanger" | "info" | "dark";

const variantClasses: Record<AdminActionButtonVariant, string> = {
  neutral: "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
  primary: "border-blue-200 bg-white text-blue-700 hover:bg-blue-50",
  primarySoft: "border-blue-100 bg-blue-50 text-blue-700 hover:bg-blue-100",
  success: "border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50",
  warning: "border-amber-200 bg-white text-amber-700 hover:bg-amber-50",
  danger: "border-red-200 bg-white text-red-700 hover:bg-red-50",
  dangerSoft: "border-red-100 bg-red-50 text-red-600 hover:bg-red-100",
  solidDanger: "border-red-600 bg-red-600 text-white hover:bg-red-700",
  info: "border-sky-200 bg-white text-sky-700 hover:bg-sky-50",
  dark: "border-slate-950 bg-slate-950 text-white hover:bg-slate-800",
};

const baseClass =
  "inline-flex min-h-9 items-center justify-center rounded-lg border px-3 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60";

type SharedProps = {
  children: ReactNode;
  variant?: AdminActionButtonVariant;
  className?: string;
};

export function adminActionButtonClassName({ variant = "neutral", className = "" }: { variant?: AdminActionButtonVariant; className?: string } = {}) {
  return `${baseClass} ${variantClasses[variant]} ${className}`.trim();
}

type LinkProps = SharedProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "className"> & {
    href: string;
  };

type ButtonProps = SharedProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className"> & {
    href?: undefined;
  };

export function AdminActionButton({ children, variant = "neutral", className = "", href, ...props }: LinkProps | ButtonProps) {
  const classes = adminActionButtonClassName({ variant, className });

  if (href) {
    return (
      <Link href={href} className={classes} {...(props as Omit<LinkProps, "children" | "variant" | "className" | "href">)}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" className={classes} {...(props as Omit<ButtonProps, "children" | "variant" | "className">)}>
      {children}
    </button>
  );
}
