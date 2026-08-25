import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Calendar, MapPin, CheckCircle, GraduationCap, ShieldCheck } from "lucide-react";
import { AaiLogo } from "../ui/AaiLogo";

type LandingItem = {
  type: "COURSE" | "SEMINAR" | string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  price: string | null;
  startsAt: string | null;
  location: string | null;
  isOnline: boolean;
};

function formatPrice(price: string | null): string {
  if (!price) return "Sob consulta";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(price));
}

function formatDateTime(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

/**
 * Conteúdo visual da landing page de curso — usado tanto na página pública
 * (`/cursos/:slug`) quanto dentro do portal do médico pra um curso que ele
 * ainda não comprou (mesma cara, só troca o que vai no `cta`: formulário
 * público vs botão de demonstrar interesse já logado).
 */
export function CourseLandingShell({
  item,
  cta,
  showHeader = true,
}: {
  item: LandingItem;
  cta: ReactNode;
  showHeader?: boolean;
}) {
  return (
    <div className={showHeader ? "brand-medico dark min-h-screen bg-bg" : ""}>
      {showHeader && (
        <header className="border-b border-line px-6 py-4">
          <Link to="/" className="flex items-center gap-2.5">
            <AaiLogo size={32} />
            <span className="font-display text-base leading-tight text-fg sm:text-lg">American Anatomy Institute</span>
          </Link>
        </header>
      )}

      <section className="relative overflow-hidden border-b border-line">
        <div
          className="absolute inset-0"
          style={
            item.imageUrl
              ? { backgroundImage: `url(${item.imageUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
              : undefined
          }
        />
        <div className="absolute inset-0 bg-gradient-to-br from-brand-navy-deep via-brand-navy/95 to-black/90" />
        <div className="pointer-events-none absolute inset-0 opacity-20 grid-bg" />
        <div className="relative mx-auto max-w-3xl px-4 py-16 text-center sm:py-20">
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-accent">
            American Anatomy Institute — {item.type === "SEMINAR" ? "Seminário Internacional" : "Curso Internacional"}
          </p>
          <h1 className="mt-4 font-display text-3xl text-brand-white sm:text-5xl">{item.title}</h1>
          <p className="mx-auto mt-4 max-w-xl text-sm text-white/70 sm:text-base">100% prática, teoria + laboratório, certificação internacional.</p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm text-white/85">
            {item.startsAt && (
              <span className="flex items-center gap-1.5 rounded-full border border-white/20 bg-white/5 px-3 py-1.5">
                <Calendar size={14} /> {formatDateTime(item.startsAt)}
              </span>
            )}
            {item.location && (
              <span className="flex items-center gap-1.5 rounded-full border border-white/20 bg-white/5 px-3 py-1.5">
                <MapPin size={14} /> {item.isOnline ? "Online" : item.location}
              </span>
            )}
            <span className="flex items-center gap-1.5 rounded-full border border-white/20 bg-white/5 px-3 py-1.5">
              <ShieldCheck size={14} /> Certificação internacional
            </span>
          </div>

          <p className="mt-6 font-display text-3xl text-brand-white">{formatPrice(item.price)}</p>
        </div>
      </section>

      <div className="mx-auto grid max-w-4xl grid-cols-1 gap-8 px-4 py-12 sm:grid-cols-[1.2fr_1fr]">
        <div className="space-y-4">
          <h2 className="flex items-center gap-2 font-display text-xl text-fg">
            <GraduationCap size={18} className="text-accent" /> Sobre o {item.type === "SEMINAR" ? "seminário" : "curso"}
          </h2>
          {item.description ? (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-fg-muted">{item.description}</p>
          ) : (
            <p className="text-sm text-fg-muted">
              Treinamento internacional presencial da American Anatomy Institute, combinando teoria e prática em
              laboratório com certificação reconhecida internacionalmente.
            </p>
          )}
          <ul className="space-y-2 text-sm text-fg-muted">
            <li className="flex items-center gap-2">
              <CheckCircle size={14} className="shrink-0 text-accent" /> Teoria + prática em laboratório
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle size={14} className="shrink-0 text-accent" /> Ambiente profissional, seguro e de alta tecnologia
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle size={14} className="shrink-0 text-accent" /> Certificado internacional de participação
            </li>
          </ul>
        </div>

        <div>{cta}</div>
      </div>
    </div>
  );
}
