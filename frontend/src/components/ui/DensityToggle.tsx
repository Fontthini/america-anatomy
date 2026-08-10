import { Rows3, Rows2 } from "lucide-react";
import { useDensity } from "../../contexts/DensityContext";

export function DensityToggle() {
  const { density, toggle } = useDensity();
  const compact = density === "compact";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={compact ? "Mudar para densidade confortável" : "Mudar para densidade compacta"}
      title={compact ? "Densidade: compacta" : "Densidade: confortável"}
      className="press inline-flex h-9 w-9 items-center justify-center rounded-md text-fg-muted hover:bg-surface-1 hover:text-fg"
    >
      {compact ? <Rows2 size={16} strokeWidth={1.5} /> : <Rows3 size={16} strokeWidth={1.5} />}
    </button>
  );
}