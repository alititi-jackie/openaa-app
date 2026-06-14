import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

type AdminActionButtonVariant = "neutral" | "primary" | "success" | "warning" | "danger" | "info";

const variantClasses: Record<AdminActionButtonVariant, string> = {
  neutral: "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
  primary: "border-blue-200 bg-white text-blue-700 hover:bg-blue-50",
  success: "border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50",
  warning: "border-amber-200 bg-white text-amber-700 hover:bg-amber-50",
  danger: "border-red-200 bg-white text-red-700 hover:bg-red-50",
  info: "border-sky-200 bg-white text-sky-700 hover:bg-sky-50",
};

const baseClass =
  "inline-flex min-h-9 items-center justify-center rounded-lg border px-3 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60";

type SharedProps = {
  children: ReactNode;
  variant?: AdminActionButtonVariant;
  className?: string;
};

type LinkProps = SharedProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "className"> & {
    href: string;
  };

type ButtonProps = SharedProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className"> & {
    href?: undefined;
  };

export function AdminActionButton({ children, variant = "neutral", className = "", href, ...props }: LinkProps | ButtonProps) {
  const classes = `${baseClass} ${variantClasses[variant]} ${className}`.trim();

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
