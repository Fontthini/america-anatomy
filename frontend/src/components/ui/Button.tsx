import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "../../lib/cn";
import { Spinner } from "./Spinner";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
};

const sizeMap: Record<Size, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-5 text-sm",
};

const variantMap: Record<Variant, string> = {
  primary:
    "bg-accent text-accent-fg hover:brightness-95 active:brightness-90 font-medium",
  secondary:
    "bg-surface-2 text-fg border border-line hover:border-line-strong",
  ghost: "bg-transparent text-fg hover:bg-surface-1",
  danger:
    "bg-transparent text-danger border border-danger/40 hover:bg-danger/10",
};

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { className, variant = "primary", size = "md", loading, leftIcon, rightIcon, children, disabled, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "press inline-flex select-none items-center justify-center gap-2 rounded-lg transition-colors duration-150 ease-out",
        "disabled:cursor-not-allowed disabled:opacity-50",
        sizeMap[size],
        variantMap[variant],
        className,
      )}
      {...props}
    >
      {loading ? <Spinner size={14} /> : leftIcon}
      {children}
      {!loading && rightIcon}
    </button>
  );
});