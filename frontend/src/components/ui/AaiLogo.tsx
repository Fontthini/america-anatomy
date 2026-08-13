export function AaiLogo({ size = 28, className = "" }: { size?: number; className?: string }) {
  return (
    <img
      src="/logo-aai.webp"
      alt="American Anatomy Institute"
      width={size}
      height={size}
      className={`shrink-0 object-contain ${className}`}
    />
  );
}
