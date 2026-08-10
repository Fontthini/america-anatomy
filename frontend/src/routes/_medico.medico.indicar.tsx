import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { MessageCircle } from "lucide-react";
import { PageContainer, PageHeader } from "../components/layout/PageContainer";
import { Card, CardBody } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Label } from "../components/ui/Label";
import { Textarea } from "../components/ui/Textarea";
import { useToast } from "../contexts/ToastContext";
import { cn } from "../lib/cn";
import { apiCreateReferral, apiListMyReferrals, type ReferralType } from "../lib/api/referrals";

export const Route = createFileRoute("/_medico/medico/indicar")({
  component: IndicarPage,
});

const typeTabs: { value: ReferralType; label: string }[] = [
  { value: "PATIENT", label: "Indicar Paciente" },
  { value: "DOCTOR", label: "Indicar Médico" },
];

function buildWhatsAppMessage(type: ReferralType, firstName: string, lastName: string): string {
  const who = type === "PATIENT" ? "um paciente" : "um(a) colega médico(a)";
  return encodeURIComponent(
    `Olá! Gostaria de indicar ${who}: ${firstName} ${lastName}. Podem entrar em contato?`,
  );
}

function IndicarPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [type, setType] = useState<ReferralType>("PATIENT");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [crm, setCrm] = useState("");
  const [notes, setNotes] = useState("");

  const { data: myReferrals = [] } = useQuery({
    queryKey: ["myReferrals"],
    queryFn: apiListMyReferrals,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      apiCreateReferral(
        type === "PATIENT"
          ? { type, firstName, lastName, whatsapp, email: email || undefined, notes: notes || undefined }
          : { type, firstName, lastName, whatsapp, email: email || undefined, notes: notes || undefined, crm },
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["myReferrals"] });
      toast({ kind: "success", title: "Indicação enviada", description: "Nossa equipe vai entrar em contato." });
      const waText = buildWhatsAppMessage(type, firstName, lastName);
      window.open(`https://wa.me/?text=${waText}`, "_blank");
      setFirstName("");
      setLastName("");
      setWhatsapp("");
      setEmail("");
      setCrm("");
      setNotes("");
    },
    onError: (err) => toast({ kind: "error", title: "Erro ao indicar", description: (err as Error).message }),
  });

  function onSubmit(ev: FormEvent) {
    ev.preventDefault();
    createMutation.mutate();
  }

  return (
    <PageContainer>
      <PageHeader eyebrow="Área do médico" title="Indicar" description="Indique pacientes ou colegas médicos." />

      <div className="flex gap-2">
        {typeTabs.map((t) => (
          <button
            key={t.value}
            onClick={() => setType(t.value)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              type === t.value
                ? "border-accent/40 bg-accent-soft text-accent"
                : "border-line text-fg-muted hover:border-line-strong hover:text-fg",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <Card>
        <CardBody>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="firstName">Nome</Label>
                <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lastName">Sobrenome</Label>
                <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input id="whatsapp" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">E-mail (opcional)</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>
            {type === "DOCTOR" && (
              <div className="space-y-1.5">
                <Label htmlFor="crm">CRM</Label>
                <Input id="crm" value={crm} onChange={(e) => setCrm(e.target.value)} required />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="notes">Observações (opcional)</Label>
              <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <Button type="submit" loading={createMutation.isPending} leftIcon={<MessageCircle size={14} />}>
              Enviar e compartilhar no WhatsApp
            </Button>
          </form>
        </CardBody>
      </Card>

      {myReferrals.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-fg">Minhas indicações</h2>
          {myReferrals.map((r) => (
            <Card key={r.id}>
              <CardBody className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-fg">
                    {r.firstName} {r.lastName}
                  </p>
                  <p className="text-xs text-fg-muted">{new Date(r.createdAt).toLocaleDateString("pt-BR")}</p>
                </div>
                <Badge tone="accent">{r.type === "PATIENT" ? r.patientStatus : r.doctorStatus}</Badge>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
