import { Link } from "@tanstack/react-router";
import {
  Calendar,
  MapPin,
  ShieldCheck,
  GraduationCap,
  CheckCircle,
  Clock,
  Award,
  MessageCircle,
  Instagram,
} from "lucide-react";
import { AaiLogo } from "../ui/AaiLogo";

const WHATSAPP_MESSAGE =
  'Olá! Tenho interesse no curso internacional em Orlando, ministrado pelo Prof. Dr. Rogério Wagner. Gostaria de mais informações, por favor.';

function waLink(number: string): string {
  return `https://wa.me/${number}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;
}

const CEO_WHATSAPP = "17543998757";
const MANAGER_WHATSAPP = "5511948348791";

function SecureSpotButton({ className = "" }: { className?: string }) {
  return (
    <a
      href={waLink(CEO_WHATSAPP)}
      target="_blank"
      rel="noreferrer"
      className={`inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-accent-fg transition hover:brightness-95 ${className}`}
    >
      <MessageCircle size={16} /> Garantir minha vaga
    </a>
  );
}

const schedule = [
  {
    day: "18 de outubro — Turma teórica",
    items: ["08:00 — Credenciamento", "08:30 — Início das aulas teóricas", "12:00 — Almoço", "13:00 — Segundo período", "18:00 — Encerramento teórico"],
  },
  {
    day: "19 de outubro — Aulas práticas",
    items: ["08:30 — Início das aulas práticas em laboratório", "12:00 — Almoço (lunch box)", "13:00 — Segundo período prático", "17:00 — Encerramento"],
  },
  {
    day: "20 de outubro — Prática e encerramento",
    items: [
      "08:30 — Início das aulas práticas em laboratório",
      "12:00 — Almoço (lunch box)",
      "13:00 — Segundo período prático",
      "16:00 — Fim das aulas",
      "16:30 — Entrega da certificação internacional",
      "17:00 — Encerramento oficial do curso",
      "20:00 — Brinde e networking",
    ],
  },
];

const included = [
  { title: "Material de estudo", desc: "Conteúdo teórico completo com apostilas e material de apoio." },
  { title: "Experiência VIP", desc: "Conforto e comodidade durante toda a experiência internacional." },
  { title: "Almoço", desc: "Lunch box fornecido nos dias de laboratório." },
  { title: "Certificação internacional", desc: "Certificado de participação após a conclusão teórica e prática." },
  { title: "Material de posicionamento internacional", desc: "Conteúdo estratégico pra presença de marca e credibilidade." },
  { title: "Welcome drink (Anatomy Network)", desc: "Evento de networking num ambiente descontraído." },
];

const faq = [
  {
    q: "Posso parcelar o pagamento?",
    a: "Sim — boleto sem juros em até 12x, ou parcelamento no cartão de crédito sem comprometer o limite. Condições especiais pra pagamento à vista, é só falar com um especialista.",
  },
  {
    q: "Vou ter suporte durante o curso?",
    a: "Todo o suporte é dado pela equipe AAI em solo americano, do início ao fim da experiência.",
  },
  {
    q: "O curso é em português?",
    a: "Sim — todas as aulas são conduzidas em português, pra melhor entendimento e absorção do conteúdo.",
  },
  {
    q: "Sobre a certificação",
    a: "A certificação internacional agrega valor real ao seu currículo, mas não autoriza sozinha a realização de procedimentos — isso depende dos conselhos profissionais de cada país.",
  },
];

export function RogerioWagnerLanding() {
  return (
    <div className="brand-medico dark min-h-screen bg-bg">
      <header className="border-b border-line px-6 py-4">
        <Link to="/" className="flex items-center gap-2.5">
          <AaiLogo size={32} />
          <span className="font-display text-base leading-tight text-fg sm:text-lg">American Anatomy Institute</span>
        </Link>
      </header>

      <div className="bg-accent px-4 py-2 text-center text-xs font-semibold uppercase tracking-wide text-accent-fg">
        Oferta especial por tempo limitado — vagas restritas pra essa turma
      </div>

      <section className="relative overflow-hidden border-b border-line">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-navy-deep via-brand-navy to-black" />
        <div className="pointer-events-none absolute inset-0 opacity-20 grid-bg" />
        <div className="relative mx-auto max-w-3xl px-4 py-16 text-center sm:py-20">
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-accent">
            American Anatomy Institute — Curso Internacional Presencial
          </p>
          <h1 className="mt-4 font-display text-3xl text-brand-white sm:text-5xl">Anatomy of Movement Course</h1>
          <p className="mx-auto mt-4 max-w-xl text-sm text-white/70 sm:text-base">
            Treinamento teórico e prático, com dissecção em cadáveres frescos congelados (fresh frozen), em
            ambiente de laboratório, com certificação internacional.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm text-white/85">
            <span className="flex items-center gap-1.5 rounded-full border border-white/20 bg-white/5 px-3 py-1.5">
              <Calendar size={14} /> 18, 19 e 20 de outubro de 2026
            </span>
            <span className="flex items-center gap-1.5 rounded-full border border-white/20 bg-white/5 px-3 py-1.5">
              <MapPin size={14} /> Orlando, EUA
            </span>
            <span className="flex items-center gap-1.5 rounded-full border border-white/20 bg-white/5 px-3 py-1.5">
              <ShieldCheck size={14} /> Certificação internacional
            </span>
          </div>

          <p className="mt-6 font-display text-3xl text-brand-white">US$ 4.000</p>
          <p className="mt-1 text-xs text-white/60">Parcelamento sem juros em até 12x — consulte condições</p>

          <div className="mt-6">
            <SecureSpotButton />
          </div>
        </div>
      </section>

      {/* Instrutor */}
      <section className="mx-auto max-w-3xl px-4 py-12">
        <div className="rounded-2xl border border-line bg-surface-1 p-6 sm:p-8">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
              <GraduationCap size={28} />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-accent">Diretor Científico da AAI</p>
              <h2 className="font-display text-xl text-fg">Prof. Dr. Rogério Wagner, PhD</h2>
              <p className="mt-1 text-sm text-fg-muted">
                Doutor em Atividade Física e Saúde, com 25 anos de experiência lecionando Anatomia. Referência em
                Ciências do Movimento, reconhecido pela profundidade técnica e ensino baseado em evidências.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Currículo */}
      <section className="mx-auto max-w-3xl px-4 pb-4">
        <h2 className="flex items-center gap-2 font-display text-xl text-fg">
          <Clock size={18} className="text-accent" /> Como funciona
        </h2>
        <ul className="mt-4 space-y-2 text-sm text-fg-muted">
          <li className="flex items-start gap-2">
            <CheckCircle size={14} className="mt-0.5 shrink-0 text-accent" />
            10 horas de aulas teóricas online na plataforma AAI — articulações, músculos (identificação, origem,
            inserção, inervação, ações, classificação funcional) e contexto de movimento.
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle size={14} className="mt-0.5 shrink-0 text-accent" />
            1 dia de aula prática com dissecção ao vivo em cadáveres frescos congelados.
          </li>
        </ul>
      </section>

      {/* Cronograma */}
      <section className="mx-auto max-w-3xl px-4 py-8">
        <h2 className="font-display text-xl text-fg">Cronograma detalhado</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {schedule.map((day) => (
            <div key={day.day} className="rounded-xl border border-line bg-surface-1 p-4">
              <p className="mb-3 text-sm font-semibold text-fg">{day.day}</p>
              <ul className="space-y-1.5 text-xs text-fg-muted">
                {day.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Inclusos */}
      <section className="mx-auto max-w-3xl px-4 py-8">
        <h2 className="font-display text-xl text-fg">O que está incluso</h2>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {included.map((item) => (
            <div key={item.title} className="flex items-start gap-2.5 rounded-xl border border-line bg-surface-1 p-4">
              <Award size={16} className="mt-0.5 shrink-0 text-accent" />
              <div>
                <p className="text-sm font-medium text-fg">{item.title}</p>
                <p className="mt-0.5 text-xs text-fg-muted">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 py-8">
        <h2 className="font-display text-xl text-fg">Perguntas frequentes</h2>
        <div className="mt-4 space-y-3">
          {faq.map((item) => (
            <div key={item.q} className="rounded-xl border border-line bg-surface-1 p-4">
              <p className="text-sm font-medium text-fg">{item.q}</p>
              <p className="mt-1 text-xs text-fg-muted">{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Contato + CTA final */}
      <section className="mx-auto max-w-3xl px-4 py-12">
        <div className="rounded-2xl border border-line-strong bg-surface-1 p-6 text-center sm:p-8">
          <h2 className="font-display text-2xl text-fg">Vagas limitadas pra essa turma</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-fg-muted">
            Fale com a equipe AAI agora pelo WhatsApp e garanta sua vaga no Anatomy of Movement Course.
          </p>
          <div className="mt-6 flex flex-col items-center gap-3">
            <SecureSpotButton />
            <a
              href="https://instagram.com/american.anatomy"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-fg-muted hover:text-accent"
            >
              <Instagram size={12} /> @american.anatomy
            </a>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-3 border-t border-line pt-6 text-left sm:grid-cols-2">
            <a
              href={waLink(CEO_WHATSAPP)}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between rounded-lg border border-line px-4 py-3 text-sm hover:border-accent/40"
            >
              <span>
                <span className="block font-medium text-fg">Arno Soares</span>
                <span className="text-xs text-fg-muted">CEO</span>
              </span>
              <MessageCircle size={16} className="text-accent" />
            </a>
            <a
              href={waLink(MANAGER_WHATSAPP)}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between rounded-lg border border-line px-4 py-3 text-sm hover:border-accent/40"
            >
              <span>
                <span className="block font-medium text-fg">Felipe Roffes</span>
                <span className="text-xs text-fg-muted">Manager</span>
              </span>
              <MessageCircle size={16} className="text-accent" />
            </a>
          </div>

          <p className="mt-6 text-center text-xs text-fg-muted">
            Já tem cadastro?{" "}
            <Link to="/login" className="text-fg underline-offset-4 hover:underline">
              Entrar
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
