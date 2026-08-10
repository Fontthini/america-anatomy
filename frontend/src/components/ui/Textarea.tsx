import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "../../lib/cn";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        className={cn(
          "min-h-[96px] w-full rounded-lg border border-line bg-surface-1 px-3 py-2 text-sm text-fg placeholder:text-fg-muted/70",
          "transition-colors duration-150 focus:border-accent/60 focus:outline-none resize-y",
          className,
        )}
        {...props}
      />
    );
  },
);