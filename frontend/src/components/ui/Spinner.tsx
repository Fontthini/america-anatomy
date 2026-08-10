import { cn } from "../../lib/cn";

export function Spinner({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <span
      role="status"
      aria-label="Carregando"
      className={cn("inline-block animate-spin rounded-full border-[1.5px] border-current border-t-transparent", className)}
      style={{ width: size, height: size }}
    />
  );
}