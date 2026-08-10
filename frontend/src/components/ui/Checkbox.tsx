import type { InputHTMLAttributes, ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "../../lib/cn";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "children"> & {
  label?: ReactNode;
};

export function Checkbox({ className, label, id, ...props }: Props) {
  const inputId = id ?? `cb-${Math.random().toString(36).slice(2, 7)}`;
  return (
    <label htmlFor={inputId} className={cn("inline-flex cursor-pointer items-center gap-2 text-sm text-fg", className)}>
      <span className="relative inline-flex h-4 w-4 items-center justify-center">
        <input
          id={inputId}
          type="checkbox"
          className="peer absolute inset-0 h-4 w-4 cursor-pointer appearance-none rounded border border-line bg-surface-1 transition-colors checked:border-accent checked:bg-accent focus:outline-none"
          {...props}
        />
        <Check
          size={12}
          strokeWidth={3}
          className="pointer-events-none relative text-accent-fg opacity-0 transition-opacity peer-checked:opacity-100"
        />
      </span>
      {label}
    </label>
  );
}