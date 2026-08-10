import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { Calendar, MapPin, CheckCircle } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Label } from "../components/ui/Label";
import { Textarea } from "../components/ui/Textarea";
import { Badge } from "../components/ui/Badge";
import { Spinner } from "../components/ui/Spinner";
import { apiGetPublicCourse, apiRegisterInterest } from "../lib/api/catalog";
import { ApiError } from "../lib/api/client";

export const Route = createFileRoute("/cursos/$slug")({
  head: () => ({ meta: [{ title: "Curso — America Anatomy Institute" }] }),
  component: PublicCoursePage,
});

function formatPrice(price: string | null): string {
  if (!price) return "Sob consulta";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(price));
}

function formatDateTime(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function PublicCoursePage() {
  const { slug } = Route.useParams();
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
    onSuccess: () => setSubmitted(true),
    onError: (err) => setError(err instanceof ApiError ? err.message : "Não foi possível enviar. Tente novamente."),
  });

  function onSubmit(ev: FormEvent) {
    ev.preventDefault();
    setError(null);
    registerMutation.mutate();
  }

  return (
    <div className="brand-medico dark min-h-screen bg-bg">
      <header className="border-b border-line px-6 py-4">
        <Link to="/" className="font-display text-lg text-fg">
          AAI<span className="text-accent">.</span>
        </Link>
      </header>

      <div className="mx-auto max-w-lg px-4 py-12">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner size={24} />
          </div>
        ) : isError || !course ? (
          <div className="text-center">
            <h1 className="font-display text-2xl text-fg">Curso não encontrado</h1>
            <p className="mt-2 text-sm text-fg-muted">Este link não é válido ou o curso não está mais disponível.</p>
          </div>
        ) : (
          <>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">
              {course.type === "SEMINAR" ? "Seminário" : "Curso"}
            </p>
            <h1 className="mt-2 font-display text-3xl text-fg">{course.title}</h1>
            {course.description && <p className="mt-3 text-sm text-fg-muted">{course.description}</p>}

            <div className="mt-4 space-y-2 text-sm text-fg-muted">
              {course.startsAt && (
                <p className="flex items-center gap-2">
                  <Calendar size={14} /> {formatDateTime(course.startsAt)}
                </p>
              )}
              {course.location && (
                <p className="flex items-center gap-2">
                  <MapPin size={14} /> {course.isOnline ? "Online" : course.location}
                </p>
              )}
            </div>

            <div className="mt-4 flex items-center gap-3">
              <span className="font-display text-2xl text-fg">{formatPrice(course.price)}</span>
              {course.vagasRestantes !== null && (
                <Badge tone={course.vagasRestantes > 0 ? "neutral" : "danger"}>
                  {course.vagasRestantes > 0 ? `${course.vagasRestantes} vagas` : "Esgotado"}
                </Badge>
              )}
            </div>

            <div className="mt-8 rounded-xl border border-line bg-surface-1 p-6">
              {submitted ? (
                <div className="flex flex-col items-center gap-3 py-4 text-center">
                  <CheckCircle size={32} className="text-success" />
                  <p className="font-display text-lg text-fg">Interesse registrado!</p>
                  <p className="text-sm text-fg-muted">
                    Nossa equipe vai entrar em contato pelo WhatsApp pra confirmar sua vaga.
                  </p>
                </div>
              ) : (
                <form onSubmit={onSubmit} className="space-y-4">
                  <p className="text-sm font-medium text-fg">Tenho interesse neste curso</p>
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
                  <Button type="submit" className="w-full" loading={registerMutation.isPending}>
                    Quero me inscrever
                  </Button>
                  <p className="text-center text-xs text-fg-muted">
                    Já tem cadastro?{" "}
                    <Link to="/login" className="text-fg underline-offset-4 hover:underline">
                      Entrar
                    </Link>
                  </p>
                </form>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
