import { useEffect, useState } from "react";

export type ThemeColors = {
  line: string;
  muted: string;
  accent: string;
  surface: string;
  fg: string;
  bg: string;
};

function read(): ThemeColors {
  if (typeof window === "undefined") {
    return { line: "", muted: "", accent: "", surface: "", fg: "", bg: "" };
  }
  const cs = getComputedStyle(document.documentElement);
  const get = (n: string) => cs.getPropertyValue(n).trim();
  return {
    line: get("--line-strong") || "rgba(255,255,255,0.1)",
    muted: get("--fg-muted") || "#8a8a8f",
    accent: get("--accent") || "#8fe3c0",
    surface: get("--surface-1") || "#141416",
    fg: get("--fg") || "#ededed",
    bg: get("--bg") || "#0a0a0b",
  };
}

export function useThemeColors(): ThemeColors {
  const [c, setC] = useState<ThemeColors>(() => read());
  useEffect(() => {
    setC(read());
    const obs = new MutationObserver(() => setC(read()));
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => obs.disconnect();
  }, []);
  return c;
}
