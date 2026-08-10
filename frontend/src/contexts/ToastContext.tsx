import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { CheckCircle2, Info, TriangleAlert, X } from "lucide-react";
import { cn } from "../lib/cn";

type ToastKind = "success" | "error" | "info";
type ToastAction = { label: string; onClick: () => void };
type Toast = {
  id: string;
  kind: ToastKind;
  title: string;
  description?: string;
  action?: ToastAction;
  duration?: number;
};

type ToastContextValue = {
  toast: (input: Omit<Toast, "id"> | string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback<ToastContextValue["toast"]>(
    (input) => {
      const t: Toast =
        typeof input === "string"
          ? { id: crypto.randomUUID(), kind: "info", title: input }
          : { id: crypto.randomUUID(), ...input };
      setItems((prev) => [...prev, t]);
      setTimeout(() => remove(t.id), t.duration ?? 4200);
    },
    [remove],
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-[340px] max-w-[calc(100vw-2rem)] flex-col gap-2">
        {items.map((t) => {
          const Icon =
            t.kind === "success" ? CheckCircle2 : t.kind === "error" ? TriangleAlert : Info;
          return (
            <div
              key={t.id}
              role="status"
              style={{ animation: "bp-page-enter var(--dur-emph) var(--ease-in) both" }}
              className={cn(
                "pointer-events-auto flex items-start gap-3 rounded-lg border border-line-strong bg-popover p-3 text-sm shadow-[var(--shadow-pop)]",
              )}
            >
              <Icon
                size={16}
                className={cn(
                  "mt-0.5 shrink-0",
                  t.kind === "success" && "text-accent",
                  t.kind === "error" && "text-danger",
                  t.kind === "info" && "text-fg-muted",
                )}
                strokeWidth={1.5}
              />
              <div className="flex-1">
                <p className="font-medium text-fg">{t.title}</p>
                {t.description ? (
                  <p className="mt-0.5 text-fg-muted">{t.description}</p>
                ) : null}
              </div>
              {t.action ? (
                <button
                  onClick={() => { t.action!.onClick(); remove(t.id); }}
                  className="press shrink-0 rounded-md border border-line px-2 py-1 text-xs font-medium text-fg hover:border-line-strong"
                >
                  {t.action.label}
                </button>
              ) : null}
              <button
                onClick={() => remove(t.id)}
                aria-label="Fechar"
                className="text-fg-muted transition hover:text-fg"
              >
                <X size={14} strokeWidth={1.5} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast deve ser usado dentro de <ToastProvider>");
  return ctx;
}