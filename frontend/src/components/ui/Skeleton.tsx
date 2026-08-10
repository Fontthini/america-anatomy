import { cn } from "../../lib/cn";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn("shimmer relative rounded-md", className)}>
      <div className="shimmer-anim absolute inset-0" />
    </div>
  );
}