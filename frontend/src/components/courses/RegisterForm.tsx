import { Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { CheckCircle, MessageCircle } from "lucide-react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Label } from "../ui/Label";
import { Textarea } from "../ui/Textarea";
import { useMutation } from "@tanstack/react-query";
import { apiRegisterInterest } from "../../lib/api/catalog";
import { ApiError } from "../../lib/api/client";

// Número oficial da AAI (mesmo do site institucional) — usado nos dois caminhos de conversão.
export const WHATSAPP_NUMBER = "14073718140";

export function whatsAppUrl(message: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

/**
 * Form de captação usado nas landing pages públicas de curso. Envia pro
 * mesmo endpoint público (register-interest) que já cria/atualiza o contato
 * no funil do CRM com o curso marcado — é o caminho que faz o lead entrar
 * no sistema de verdade, diferente de um botão de WhatsApp isolado.
 */
export function CourseRegisterForm({ courseId, courseTitle }: { courseId: string; courseTitle: string }) {
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [crm, setCrm] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const registerMutation = useMutation({
    mutationFn: () =>
      apiRegisterInterest(courseId, {
        name,
        email,
        whatsapp,
        crm,
        ...(notes ? { notes } : {}),
      }),
    onSuccess: () => {
      setSubmitted(true);
      const message = `Olá! Me chamo ${name}, acabei de me inscrever no curso "${courseTitle}" pelo site (e-mail ${email}). Aguardo confirmação da vaga!`;
      window.open(whatsAppUrl(message), "_blank");
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : "Não foi possível enviar. Tente novamente."),
  });

  function onSubmit(ev: FormEvent) {
    ev.preventDefault();
    setError(null);
    registerMutation.mutate();
  }

  const directWhatsAppUrl = whatsAppUrl(`Olá! Tenho interesse no curso "${courseTitle}". Pode me passar mais informações?`);

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
              <Label htmlFor="reg-name">Nome completo</Label>
              <Input id="reg-name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reg-email">E-mail</Label>
              <Input id="reg-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="reg-crm">CRM ou outro registro profissional</Label>
                <Input id="reg-crm" value={crm} onChange={(e) => setCrm(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reg-whatsapp">WhatsApp</Label>
                <Input id="reg-whatsapp" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} required />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reg-notes">Observações (opcional)</Label>
              <Textarea id="reg-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            {error && <p className="text-xs text-danger">{error}</p>}
            <Button type="submit" className="w-full" loading={registerMutation.isPending}>
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
