import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "../../lib/cn";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  error?: string;
};

export const Input = forwardRef<HTMLInputElement, Props>(function Input(
  { className, error, ...props },
  ref,
) {
  return (
    <div className="w-full">
      <input
        ref={ref}
        aria-invalid={error ? true : undefined}
        className={cn(
          "h-10 w-full rounded-lg border border-line bg-surface-1 px-3 text-sm text-fg placeholder:text-fg-muted/70",
          "transition-colors duration-150 focus:border-accent/60 focus:outline-none",
          "disabled:cursor-not-allowed disabled:opacity-50",
          error && "border-danger/50 focus:border-danger",
          className,
        )}
        {...props}
      />
      {error ? <p className="mt-1.5 text-xs text-danger">{error}</p> : null}
    </div>
  );
});