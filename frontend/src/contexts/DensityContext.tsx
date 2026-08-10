import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

type Density = "comfortable" | "compact";
type Ctx = { density: Density; setDensity: (d: Density) => void; toggle: () => void };

const DensityContext = createContext<Ctx | null>(null);
const STORAGE = "bp.density";

function readInitial(): Density {
  if (typeof window === "undefined") return "comfortable";
  return (localStorage.getItem(STORAGE) as Density) ?? "comfortable";
}

export function DensityProvider({ children }: { children: ReactNode }) {
  const [density, setDensityState] = useState<Density>("comfortable");

  useEffect(() => {
    const d = readInitial();
    setDensityState(d);
    document.documentElement.dataset.density = d;
  }, []);

  const setDensity = useCallback((d: Density) => {
    setDensityState(d);
    document.documentElement.dataset.density = d;
    try { localStorage.setItem(STORAGE, d); } catch { /* noop */ }
  }, []);

  const toggle = useCallback(() => {
    setDensity(density === "comfortable" ? "compact" : "comfortable");
  }, [density, setDensity]);

  return (
    <DensityContext.Provider value={{ density, setDensity, toggle }}>
      {children}
    </DensityContext.Provider>
  );
}

export function useDensity() {
  const ctx = useContext(DensityContext);
  if (!ctx) throw new Error("useDensity dentro de <DensityProvider>");
  return ctx;
}