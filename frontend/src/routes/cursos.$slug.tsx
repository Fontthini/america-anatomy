import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { Calendar, MapPin, CheckCircle, GraduationCap, ShieldCheck, MessageCircle } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Label } from "../components/ui/Label";
import { Textarea } from "../components/ui/Textarea";
import { Spinner } from "../components/ui/Spinner";
import { AaiLogo } from "../components/ui/AaiLogo";
import { RogerioWagnerLanding } from "../components/courses/RogerioWagnerLanding";
import { apiGetPublicCourse, apiRegisterInterest } from "../lib/api/catalog";
import { ApiError } from "../lib/api/client";

// Teste de landing "cópia fiel" — isolado só neste curso, não afeta os outros 34
// (ver [[project-scope]] / memória da Fase 5). Quando validado, decide se replica.
const FAITHFUL_CLONE_SLUGS: Record<string, typeof RogerioWagnerLanding> = {
  "anatomy-of-movement-course-orlando-fl": RogerioWagnerLanding,
};

export const Route = createFileRoute("/cursos/$slug")({
  head: () => ({ meta: [{ title: "Curso — America Anatomy Institute" }] }),
  component: PublicCoursePage,
});

// Número oficial da AAI (mesmo do site institucional) — usado nos dois caminhos de conversão.
const WHATSAPP_NUMBER = "14073718140";

function whatsAppUrl(message: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

function formatPrice(price: string | null): string {
  if (!price) return "Sob consulta";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(price));
}

function formatDateTime(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function RegisterForm({
  submitted,
  name,
  setName,
  email,
  setEmail,
  crm,
  setCrm,
  whatsapp,
  setWhatsapp,
  notes,
  setNotes,
  error,
  onSubmit,
  submitting,
  directWhatsAppUrl,
}: {
  submitted: boolean;
  name: string;
  setName: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  crm: string;
  setCrm: (v: string) => void;
  whatsapp: string;
  setWhatsapp: (v: string) => void;
  notes: string;
  setNotes: (v: string) => void;
  error: string | null;
  onSubmit: (ev: FormEvent) => void;
  submitting: boolean;
  directWhatsAppUrl: string;
}) {
  return (
    <div className="rounded-2xl border border-line-strong bg-surface-1 p-6 shadow-[var(--shadow-pop)]">
      {submitted ? (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <CheckCircle size={32} className="text-success" />
          <p className="font-display text-lg text-fg">Interesse registrado!</p>
          <p className="text-sm text-fg-muted">
            Abrimos o WhatsApp com sua mensagem pronta — se não abriu, é só chamar a gente por lá pra confirmar sua vaga.
          </p>
          <a
            href={directWhatsAppUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-1 inline-flex items-center gap-2 text-sm font-medium text-accent hover:underline"
          >
            <MessageCircle size={14} /> Abrir WhatsApp de novo
          </a>
        </div>
      ) : (
        <>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <p className="font-display text-lg text-fg">Garanta sua vaga</p>
              <p className="text-xs text-fg-muted">Preencha seus dados — ao enviar, já te levamos direto pro WhatsApp da equipe.</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="name">Nome completo</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="crm">CRM (opcional)</Label>
                <Input id="crm" value={crm} onChange={(e) => setCrm(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input id="whatsapp" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} required />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notes">Observações (opcional)</Label>
              <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            {error && <p className="text-xs text-danger">{error}</p>}
            <Button type="submit" className="w-full" loading={submitting}>
              Quero me inscrever
            </Button>
          </form>

          <div className="my-4 flex items-center gap-3 text-xs text-fg-muted">
            <span className="h-px flex-1 bg-line" /> ou <span className="h-px flex-1 bg-line" />
          </div>

          <a
            href={directWhatsAppUrl}
            target="_blank"
            rel="noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-line px-4 py-2.5 text-sm font-medium text-fg transition-colors hover:border-accent/40 hover:text-accent"
          >
            <MessageCircle size={16} /> Falar direto no WhatsApp
          </a>

          <p className="mt-4 text-center text-xs text-fg-muted">
            Já tem cadastro?{" "}
            <Link to="/login" className="text-fg underline-offset-4 hover:underline">
              Entrar
            </Link>
          </p>
        </>
      )}
    </div>
  );
}

function PublicCoursePage() {
  const { slug } = Route.useParams();

  const FaithfulClone = FAITHFUL_CLONE_SLUGS[slug];
  if (FaithfulClone) {
    return <FaithfulClone />;
  }

  return <GenericCoursePage slug={slug} />;
}

function GenericCoursePage({ slug }: { slug: string }) {
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [crm, setCrm] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { data: course, isLoading, isError } = useQuery({
    queryKey: ["publicCourse", slug],
    queryFn: () => apiGetPublicCourse(slug),
    retry: false,
  });

  const registerMutation = useMutation({
    mutationFn: () => {
      if (!course) throw new Error("Curso não carregado.");
      return apiRegisterInterest(course.id, {
        name,
        email,
        whatsapp,
        ...(crm ? { crm } : {}),
        ...(notes ? { notes } : {}),
      });
    },
    onSuccess: () => {
      setSubmitted(true);
      const message = `Olá! Me chamo ${name}, acabei de me inscrever no curso "${course?.title}" pelo site (e-mail ${email}). Aguardo confirmação da vaga!`;
      window.open(whatsAppUrl(message), "_blank");
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : "Não foi possível enviar. Tente novamente."),
  });

  function onSubmit(ev: FormEvent) {
    ev.preventDefault();
    setError(null);
    registerMutation.mutate();
  }

  if (isLoading) {
    return (
      <div className="brand-medico dark flex min-h-screen items-center justify-center bg-bg">
        <Spinner size={24} />
      </div>
    );
  }

  if (isError || !course) {
    return (
      <div className="brand-medico dark flex min-h-screen flex-col items-center justify-center gap-2 bg-bg text-center">
        <h1 className="font-display text-2xl text-fg">Curso não encontrado</h1>
        <p className="text-sm text-fg-muted">Este link não é válido ou o curso não está mais disponível.</p>
      </div>
    );
  }

  const directWhatsAppUrl = whatsAppUrl(
    `Olá! Tenho interesse no curso "${course.title}"${course.startsAt ? ` (${formatDateTime(course.startsAt)})` : ""}. Pode me passar mais informações?`,
  );

  const formProps = {
    submitted,
    name,
    setName,
    email,
    setEmail,
    crm,
    setCrm,
    whatsapp,
    setWhatsapp,
    notes,
    setNotes,
    error,
    onSubmit,
    submitting: registerMutation.isPending,
    directWhatsAppUrl,
  };

  return (
    <div className="brand-medico dark min-h-screen bg-bg">
      <header className="border-b border-line px-6 py-4">
        <Link to="/" className="flex items-center gap-2.5">
          <AaiLogo size={32} />
          <span className="font-display text-base leading-tight text-fg sm:text-lg">American Anatomy Institute</span>
        </Link>
      </header>

      <section className="relative overflow-hidden border-b border-line">
        <div
          className="absolute inset-0"
          style={
            course.imageUrl
              ? { backgroundImage: `url(${course.imageUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
              : undefined
          }
        />
        <div className="absolute inset-0 bg-gradient-to-br from-brand-navy-deep via-brand-navy/95 to-black/90" />
        <div className="pointer-events-none absolute inset-0 opacity-20 grid-bg" />
        <div className="relative mx-auto max-w-3xl px-4 py-16 text-center sm:py-20">
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-accent">
            American Anatomy Institute — {course.type === "SEMINAR" ? "Seminário Internacional" : "Curso Internacional"}
          </p>
          <h1 className="mt-4 font-display text-3xl text-brand-white sm:text-5xl">{course.title}</h1>
          <p className="mx-auto mt-4 max-w-xl text-sm text-white/70 sm:text-base">100% prática, teoria + laboratório, certificação internacional.</p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm text-white/85">
            {course.startsAt && (
              <span className="flex items-center gap-1.5 rounded-full border border-white/20 bg-white/5 px-3 py-1.5">
                <Calendar size={14} /> {formatDateTime(course.startsAt)}
              </span>
            )}
            {course.location && (
              <span className="flex items-center gap-1.5 rounded-full border border-white/20 bg-white/5 px-3 py-1.5">
                <MapPin size={14} /> {course.isOnline ? "Online" : course.location}
              </span>
            )}
            <span className="flex items-center gap-1.5 rounded-full border border-white/20 bg-white/5 px-3 py-1.5">
              <ShieldCheck size={14} /> Certificação internacional
            </span>
          </div>

          <p className="mt-6 font-display text-3xl text-brand-white">{formatPrice(course.price)}</p>
        </div>
      </section>

      <div className="mx-auto grid max-w-4xl grid-cols-1 gap-8 px-4 py-12 sm:grid-cols-[1.2fr_1fr]">
        <div className="space-y-4">
          <h2 className="flex items-center gap-2 font-display text-xl text-fg">
            <GraduationCap size={18} className="text-accent" /> Sobre o {course.type === "SEMINAR" ? "seminário" : "curso"}
          </h2>
          {course.description ? (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-fg-muted">{course.description}</p>
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

        <div>
          <RegisterForm {...formProps} />
        </div>
      </div>
    </div>
  );
}
