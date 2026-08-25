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
          <Link to="/" className="flex items-center gap-2.5">
            <AaiLogo size={34} />
            <span className="font-display text-base leading-tight text-fg sm:text-lg">American Anatomy Institute</span>
          </Link>
          <ThemeToggle />
        </header>
        <main className="mx-auto w-full max-w-[380px] py-12">{children}</main>
        <footer className="text-xs text-fg-muted">
          © {new Date().getFullYear()} American Anatomy Institute.
        </footer>
      </div>

      {/* Brand column */}
      <div className="relative hidden overflow-hidden border-l border-line md:flex md:flex-col md:justify-between md:p-14">
        <img
          src="/login-hero.webp"
          alt="Treinamento prático da American Anatomy Institute"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-black/30" />
        <div className="relative text-xs uppercase tracking-[0.2em] text-white/70">
          — Portal America Anatomy Institute
        </div>
        <blockquote className="relative max-w-md">
          <p className="font-display text-5xl leading-[1.05] text-white">
            {quote}
          </p>
          <p className="mt-6 text-sm text-white/70">{caption}</p>
        </blockquote>
        <div className="relative flex items-center justify-between text-xs text-white/70">
          <span>Orlando, FL · EUA</span>
          <span className="font-mono">/ {String(new Date().getFullYear()).slice(-2)}</span>
        </div>
      </div>
    </div>
  );
}