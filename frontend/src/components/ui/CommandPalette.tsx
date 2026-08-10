import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  User,
  Search,
  LogOut,
  Sun,
  Moon,
  History,
  ArrowRight,
} from "lucide-react";
import { cn } from "../../lib/cn";
import { useTheme } from "../../contexts/ThemeContext";
import { useAuth } from "../../contexts/AuthContext";

type Item = {
  id: string;
  label: string;
  group: "Páginas" | "Ações" | "Recentes";
  hint?: string;
  shortcut?: string;
  icon: typeof LayoutDashboard;
  run: () => void;
};

const RECENTS_KEY = "bp.cmd.recents";

function fuzzy(q: string, label: string) {
  if (!q) return 1;
  const l = label.toLowerCase();
  const Q = q.toLowerCase();
  if (l.includes(Q)) return 2 + (l.startsWith(Q) ? 1 : 0);
  // letter-order match
  let i = 0;
  for (const c of l) if (c === Q[i]) i++;
  return i === Q.length ? 1 : 0;
}

export function CommandPalette({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const { toggle: toggleTheme, theme } = useTheme();
  const { logout } = useAuth();
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const [recents, setRecents] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  // Load recents
  useEffect(() => {
    try {
      const raw = localStorage.getItem(RECENTS_KEY);
      if (raw) setRecents(JSON.parse(raw));
    } catch {/* noop */}
  }, []);

  // Focus management
  useEffect(() => {
    if (open) {
      previousFocus.current = document.activeElement as HTMLElement;
      setQ("");
      setActive(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    } else {
      previousFocus.current?.focus?.();
    }
  }, [open]);

  const pushRecent = useCallback((id: string) => {
    setRecents((prev) => {
      const next = [id, ...prev.filter((x) => x !== id)].slice(0, 4);
      try { localStorage.setItem(RECENTS_KEY, JSON.stringify(next)); } catch {/* noop */}
      return next;
    });
  }, []);

  const runAction = useCallback(
    (item: Item) => {
      pushRecent(item.id);
      onClose();
      item.run();
    },
    [onClose, pushRecent],
  );

  const allItems: Item[] = useMemo(() => [
    { id: "go-dash", group: "Páginas", label: "Ir para Dashboard", icon: LayoutDashboard, shortcut: "G D", run: () => navigate({ to: "/dashboard" }) },
    { id: "go-profile", group: "Páginas", label: "Ir para Perfil", icon: User, shortcut: "G P", run: () => navigate({ to: "/profile" }) },
    { id: "act-theme", group: "Ações", label: theme === "dark" ? "Trocar para tema claro" : "Trocar para tema escuro", icon: theme === "dark" ? Sun : Moon, run: () => toggleTheme() },
    { id: "act-logout", group: "Ações", label: "Sair da conta", icon: LogOut, run: () => { logout(); navigate({ to: "/login" }); } },
    { id: "act-search-docs", group: "Ações", label: "Buscar na documentação (mock)", icon: Search, run: () => {/* noop */} },
  ], [navigate, theme, toggleTheme, logout]);

  const filtered = useMemo(() => {
    if (!q && recents.length) {
      const recentItems = recents
        .map((id) => allItems.find((i) => i.id === id))
        .filter(Boolean)
        .map((i) => ({ ...(i as Item), group: "Recentes" as const }));
      return [...recentItems, ...allItems];
    }
    return allItems
      .map((i) => ({ i, score: fuzzy(q, i.label) }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((x) => x.i);
  }, [q, recents, allItems]);

  useEffect(() => { setActive(0); }, [q]);

  // Key handlers (Esc, arrows, Enter)
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") { e.preventDefault(); onClose(); return; }
      if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, filtered.length - 1)); }
      if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
      if (e.key === "Enter") { e.preventDefault(); const it = filtered[active]; if (it) runAction(it); }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, filtered, active, onClose, runAction]);

  if (!open) return null;

  // Group rendering
  const groups: Record<string, Item[]> = {};
  filtered.forEach((it) => { (groups[it.group] ||= []).push(it); });

  let runningIdx = -1;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Paleta de comandos"
      className="fixed inset-0 z-[200] flex items-start justify-center px-4 pt-[12vh]"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-[bp-page-enter_var(--dur-std)_var(--ease-in)_both]" />
      <div
        className="relative w-full max-w-[560px] overflow-hidden rounded-xl border border-line-strong bg-popover shadow-[var(--shadow-pop)]"
        style={{ animation: "bp-page-enter var(--dur-emph) var(--ease-in) both" }}
      >
        <div className="flex items-center gap-2 border-b border-line px-3.5">
          <Search size={15} strokeWidth={1.5} className="text-fg-muted" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar páginas, ações…"
            className="h-12 flex-1 bg-transparent text-sm text-fg placeholder:text-fg-muted/80 focus:outline-none"
          />
          <kbd className="rounded border border-line bg-surface-2 px-1.5 py-0.5 text-[10px] text-fg-muted">Esc</kbd>
        </div>

        <div className="max-h-[50vh] overflow-y-auto p-1.5">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <Search size={20} strokeWidth={1.25} className="text-fg-muted" />
              <p className="text-sm text-fg">Nenhum resultado para "{q}"</p>
              <p className="text-xs text-fg-muted">Tente outra palavra-chave.</p>
            </div>
          ) : (
            Object.entries(groups).map(([group, items]) => (
              <div key={group} className="mb-2">
                <p className="flex items-center gap-1.5 px-2.5 pb-1 pt-2 text-[10px] font-medium uppercase tracking-[0.16em] text-fg-muted">
                  {group === "Recentes" ? <History size={11} strokeWidth={1.5} /> : null}
                  {group}
                </p>
                {items.map((it) => {
                  runningIdx++;
                  const isActive = runningIdx === active;
                  const Icon = it.icon;
                  return (
                    <Row
                      key={it.id + group}
                      active={isActive}
                      onMouseEnter={() => setActive(runningIdx)}
                      onClick={() => runAction(it)}
                    >
                      <Icon size={14} strokeWidth={1.5} className="text-fg-muted" />
                      <span className="flex-1 text-sm text-fg">{it.label}</span>
                      {it.shortcut ? (
                        <kbd className="rounded border border-line bg-surface-2 px-1.5 py-0.5 text-[10px] text-fg-muted">
                          {it.shortcut}
                        </kbd>
                      ) : null}
                      {isActive ? <ArrowRight size={12} className="text-fg-muted" /> : null}
                    </Row>
                  );
                })}
              </div>
            ))
          )}
        </div>

        <div className="flex items-center justify-between border-t border-line bg-surface-2/50 px-3 py-2 text-[11px] text-fg-muted">
          <span className="flex items-center gap-2">
            <kbd className="rounded border border-line bg-popover px-1.5 py-0.5">↑↓</kbd> navegar
            <kbd className="ml-1 rounded border border-line bg-popover px-1.5 py-0.5">↵</kbd> selecionar
          </span>
          <span>Paleta de comandos</span>
        </div>
      </div>
    </div>
  );
}

function Row({
  active,
  children,
  onClick,
  onMouseEnter,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
  onMouseEnter: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left transition-colors",
        active ? "bg-surface-2 dark:bg-surface-3" : "hover:bg-surface-2/60",
      )}
    >
      {children}
    </button>
  );
}