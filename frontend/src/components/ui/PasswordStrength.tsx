import { cn } from "../../lib/cn";

export function scorePassword(p: string): 0 | 1 | 2 | 3 | 4 {
  let s = 0;
  if (p.length >= 8) s++;
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s++;
  if (/\d/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;
  return Math.min(s, 4) as 0 | 1 | 2 | 3 | 4;
}

const LABELS = ["—", "Fraca", "Razoável", "Boa", "Forte"];

export function PasswordStrength({ value }: { value: string }) {
  const score = scorePassword(value);
  return (
    <div className="mt-2">
      <div className="flex gap-1.5">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={cn(
              "h-[3px] flex-1 rounded-full transition-colors",
              i < score ? "bg-accent" : "bg-surface-3",
            )}
          />
        ))}
      </div>
      <p className="mt-1.5 text-[11px] uppercase tracking-wide text-fg-muted">
        Força: <span className="text-fg">{LABELS[score]}</span>
      </p>
    </div>
  );
}