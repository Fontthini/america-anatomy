import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ThemeToggle } from "../ui/ThemeToggle";
import { AaiLogo } from "../ui/AaiLogo";

export function AuthSplit({
  children,
  quote = "Build with restraint.",
  caption = "Calmly engineered interfaces.",
}: {
  children: ReactNode;
  quote?: string;
  caption?: string;
}) {
  return (
    <div className="grid min-h-screen grid-cols-1 md:grid-cols-2">
      {/* Form column */}
      <div className="flex flex-col justify-between px-6 py-8 md:px-14 md:py-12">
        <header className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-display text-xl text-fg">
            <AaiLogo size={32} />
            AAI<span className="text-accent">.</span>
          </Link>
          <ThemeToggle />
        </header>
        <main className="mx-auto w-full max-w-[380px] py-12">{children}</main>
        <footer className="text-xs text-fg-muted">
          © {new Date().getFullYear()} American Anatomy Institute.
        </footer>
      </div>

      {/* Brand column */}
      <div className="relative hidden border-l border-line bg-bg-elev md:flex md:flex-col md:justify-between md:p-14">
        <div className="text-xs uppercase tracking-[0.2em] text-fg-muted">
          — Portal America Anatomy Institute
        </div>
        <blockquote className="max-w-md">
          <p className="font-display text-5xl leading-[1.05] text-fg">
            {quote}
          </p>
          <p className="mt-6 text-sm text-fg-muted">{caption}</p>
        </blockquote>
        <div className="flex items-center justify-between text-xs text-fg-muted">
          <span>São Paulo · BR</span>
          <span className="font-mono">/ {String(new Date().getFullYear()).slice(-2)}</span>
        </div>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 grid-bg opacity-60"
        />
      </div>
    </div>
  );
}