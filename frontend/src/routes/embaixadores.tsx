import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { CheckCircle, Megaphone, Users, Sparkles, Award } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Label } from "../components/ui/Label";
import { Textarea } from "../components/ui/Textarea";
import { AaiLogo } from "../components/ui/AaiLogo";
import { apiApplyAsAmbassador } from "../lib/api/ambassadors";
import { ApiError } from "../lib/api/client";

export const Route = createFileRoute("/embaixadores")({
  head: () => ({ meta: [{ title: "Embaixadores — American Anatomy Institute" }] }),
  component: AmbassadorsPage,
});

const profileOptions = [
  "Estudante de saúde",
  "Profissional de saúde",
  "Fluente em inglês",
  "Outro",
];

const benefits = [
  "Certificação internacional como Embaixador Oficial",
  "Bolsas parciais ou acesso gratuito a seminários AAI",
  "Networking com médicos e instituições renomadas",
  "Acesso antecipado a treinamentos e novas iniciativas",
  "Participação em mentorias exclusivas e eventos ao vivo",
  "Kit completo de comunicação digital + suporte",
  "Destaque nos canais oficiais AAI",
];

function AmbassadorsPage() {
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [profileType, setProfileType] = useState(profileOptions[0]);
  const [alreadyKnowsAai, setAlreadyKnowsAai] = useState<boolean | null>(null);
  const [availableForLives, setAvailableForLives] = useState<boolean | null>(null);
  const [hasNetwork, setHasNetwork] = useState<boolean | null>(null);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const applyMutation = useMutation({
    mutationFn: () =>
      apiApplyAsAmbassador({
        name,
        email,
        whatsapp,
        profileType,
        alreadyKnowsAai: alreadyKnowsAai ?? false,
        availableForLives: availableForLives ?? false,
        hasNetwork: hasNetwork ?? false,
        ...(notes ? { notes } : {}),
      }),
    onSuccess: () => setSubmitted(true),
    onError: (err) => setError(err instanceof ApiError ? err.message : "Não foi possível enviar. Tente novamente."),
  });

  function onSubmit(ev: FormEvent) {
    ev.preventDefault();
    setError(null);
    applyMutation.mutate();
  }

  function YesNo({ value, onChange }: { value: boolean | null; onChange: (v: boolean) => void }) {
    return (
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onChange(true)}
          className={`h-9 flex-1 rounded-md border text-sm font-medium transition-colors ${value === true ? "border-accent/40 bg-accent-soft text-accent" : "border-line text-fg-muted hover:border-line-strong hover:text-fg"}`}
        >
          Sim
        </button>
        <button
          type="button"
          onClick={() => onChange(false)}
          className={`h-9 flex-1 rounded-md border text-sm font-medium transition-colors ${value === false ? "border-accent/40 bg-accent-soft text-accent" : "border-line text-fg-muted hover:border-line-strong hover:text-fg"}`}
        >
          Não
        </button>
      </div>
    );
  }

  return (
    <div className="brand-medico dark min-h-screen bg-bg">
      <header className="border-b border-line px-6 py-4">
        <Link to="/" className="flex items-center gap-2 font-display text-lg text-fg">
          <AaiLogo size={30} />
          AAI<span className="text-accent">.</span>
        </Link>
      </header>

      <section className="relative overflow-hidden border-b border-line">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-navy-deep via-brand-navy to-black" />
        <div className="pointer-events-none absolute inset-0 opacity-20 grid-bg" />
        <div className="relative mx-auto max-w-2xl px-4 py-16 text-center sm:py-20">
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-accent">American Anatomy Institute</p>
          <h1 className="mt-4 font-display text-3xl text-brand-white sm:text-5xl">Seja a Voz da Anatomia</h1>
          <p className="mx-auto mt-4 max-w-xl text-sm text-white/70 sm:text-base">
            Torne-se Embaixador Oficial do American Anatomy Institute. Leve conhecimento, inspire futuros
            profissionais e transforme a educação em saúde.
          </p>
        </div>
      </section>

      <div className="mx-auto grid max-w-4xl grid-cols-1 gap-8 px-4 py-12 sm:grid-cols-[1.2fr_1fr]">
        <div className="space-y-6">
          <div>
            <h2 className="flex items-center gap-2 font-display text-xl text-fg">
              <Megaphone size={18} className="text-accent" /> Por que ser Embaixador AAI?
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-fg-muted">
              O American Anatomy Institute está revolucionando a educação médica nos Estados Unidos com
              experiências práticas em cadáveres frescos, mentoria exclusiva e certificações internacionais.
              Buscamos embaixadores apaixonados por saúde e comprometidos em expandir esse movimento educacional.
            </p>
          </div>

          <div>
            <h2 className="flex items-center gap-2 font-display text-lg text-fg">
              <Award size={16} className="text-accent" /> Benefícios exclusivos
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-fg-muted">
              {benefits.map((b) => (
                <li key={b} className="flex items-center gap-2">
                  <CheckCircle size={14} className="shrink-0 text-accent" /> {b}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="flex items-center gap-2 font-display text-lg text-fg">
              <Users size={16} className="text-accent" /> O que esperamos de você
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-fg-muted">
              <li className="flex items-center gap-2">
                <Sparkles size={14} className="shrink-0 text-accent" /> Compartilhar conteúdo AAI nas redes sociais
              </li>
              <li className="flex items-center gap-2">
                <Sparkles size={14} className="shrink-0 text-accent" /> Indicar colegas e profissionais para os seminários
              </li>
              <li className="flex items-center gap-2">
                <Sparkles size={14} className="shrink-0 text-accent" /> Representar a AAI com profissionalismo e integridade
              </li>
            </ul>
          </div>
        </div>

        <div>
          <div className="rounded-2xl border border-line-strong bg-surface-1 p-6 shadow-[var(--shadow-pop)]">
            {submitted ? (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <CheckCircle size={32} className="text-success" />
                <p className="font-display text-lg text-fg">Candidatura enviada!</p>
                <p className="text-sm text-fg-muted">
                  Nossa equipe vai revisar seu perfil e entrar em contato pelo WhatsApp.
                </p>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-4">
                <p className="font-display text-lg text-fg">Quero ser Embaixador AAI</p>
                <div className="space-y-1.5">
                  <Label htmlFor="name">Nome completo</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">E-mail</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="whatsapp">WhatsApp</Label>
                  <Input id="whatsapp" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="profileType">Você é:</Label>
                  <select
                    id="profileType"
                    value={profileType}
                    onChange={(e) => setProfileType(e.target.value)}
                    className="h-10 w-full rounded-md border border-line bg-surface-1 px-3 text-sm text-fg focus:border-accent/60 focus:outline-none"
                  >
                    {profileOptions.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>Já conhece a AAI?</Label>
                  <YesNo value={alreadyKnowsAai} onChange={setAlreadyKnowsAai} />
                </div>
                <div className="space-y-1.5">
                  <Label>Disponível para lives, treinamentos e divulgações online?</Label>
                  <YesNo value={availableForLives} onChange={setAvailableForLives} />
                </div>
                <div className="space-y-1.5">
                  <Label>Tem um grupo ou rede de colegas de saúde?</Label>
                  <YesNo value={hasNetwork} onChange={setHasNetwork} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="notes">Observações (opcional)</Label>
                  <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
                </div>
                {error && <p className="text-xs text-danger">{error}</p>}
                <Button type="submit" className="w-full" loading={applyMutation.isPending}>
                  Quero ser Embaixador AAI
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
