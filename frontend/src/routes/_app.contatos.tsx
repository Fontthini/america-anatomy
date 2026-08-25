import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { UserPlus, X, Phone, MessageCircle, Mail, StickyNote, CreditCard, Plus, Check } from "lucide-react";
import { PageContainer, PageHeader } from "../components/layout/PageContainer";
import { Card, CardBody } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Label } from "../components/ui/Label";
import { Textarea } from "../components/ui/Textarea";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { cn } from "../lib/cn";
import {
  apiListLeads,
  apiCreateLead,
  apiUpdateLead,
  apiUpdateFunnelStage,
  apiClaimLead,
  apiRequestLeadReview,
  apiListLeadActivities,
  apiCreateLeadActivity,
  apiListLeadReminders,
  apiCreateLeadReminder,
  apiUpdateLeadReminder,
  type FunnelStage,
  type LeadSource,
  type LeadActivityType,
  type LeadResponse,
  type CreateLeadPayload,
} from "../lib/api/crm";
import { apiListCatalogItems } from "../lib/api/catalog";

export const Route = createFileRoute("/_app/contatos")({
  component: ContactsPage,
});

const STAGES: { value: FunnelStage; label: string }[] = [
  { value: "NEW", label: "Novo Lead" },
  { value: "FIRST_CONTACT", label: "Primeiro Contato" },
  { value: "AWAITING_RESPONSE", label: "Aguardando Resposta" },
  { value: "INFO_RECEIVED", label: "Recebeu Informações" },
  { value: "INTERESTED", label: "Interessado" },
  { value: "PAYMENT_LINK_SENT", label: "Link/Pix Enviado" },
  { value: "CUSTOMER", label: "Matrícula Concluída" },
  { value: "WITHDRAWN", label: "Desistiu" },
  { value: "LOST", label: "Perdido" },
];

const LEAD_SOURCES: { value: LeadSource; label: string }[] = [
  { value: "INSTAGRAM", label: "Instagram" },
  { value: "FACEBOOK", label: "Facebook" },
  { value: "GOOGLE", label: "Google" },
  { value: "LINKEDIN", label: "LinkedIn" },
  { value: "SITE", label: "Site" },
  { value: "INDICACAO", label: "Indicação" },
  { value: "CONGRESSO", label: "Congresso" },
  { value: "EVENTO", label: "Evento" },
  { value: "WHATSAPP_UNINGA", label: "WhatsApp Uningá" },
  { value: "EX_ALUNO", label: "Ex-aluno" },
  { value: "OUTRO", label: "Outro" },
];

const ACTIVITY_TYPES: { value: LeadActivityType; label: string; icon: typeof Phone }[] = [
  { value: "CALL", label: "Ligação", icon: Phone },
  { value: "WHATSAPP", label: "WhatsApp", icon: MessageCircle },
  { value: "EMAIL", label: "E-mail", icon: Mail },
  { value: "NOTE", label: "Observação", icon: StickyNote },
  { value: "PAYMENT_METHOD", label: "Forma de pagamento enviada", icon: CreditCard },
];

const scopeTabs: { value: "mine" | "unassigned" | "all"; label: string }[] = [
  { value: "mine", label: "Meus" },
  { value: "unassigned", label: "Livres" },
  { value: "all", label: "Todos" },
];

function sourceLabel(source: LeadSource | null): string | null {
  return source ? (LEAD_SOURCES.find((s) => s.value === source)?.label ?? source) : null;
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

// ---------------------------------------------------------------------------
// Drawer de detalhe do contato — cadastro completo, histórico e agenda
// ---------------------------------------------------------------------------

function LeadDrawer({ lead, onClose }: { lead: LeadResponse; onClose: () => void }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [tab, setTab] = useState<"dados" | "historico" | "agenda">("dados");

  const [phone, setPhone] = useState(lead.phone ?? "");
  const [profession, setProfession] = useState(lead.profession ?? "");
  const [specialty, setSpecialty] = useState(lead.specialty ?? "");
  const [crm, setCrm] = useState(lead.crm ?? "");
  const [cpf, setCpf] = useState(lead.cpf ?? "");
  const [clinicName, setClinicName] = useState(lead.clinicName ?? "");
  const [city, setCity] = useState(lead.city ?? "");
  const [state, setState] = useState(lead.state ?? "");
  const [leadSource, setLeadSource] = useState<LeadSource | "">(lead.leadSource ?? "");
  const [courseOfInterestId, setCourseOfInterestId] = useState(lead.courseOfInterestId ?? "");

  const { data: courses = [] } = useQuery({
    queryKey: ["catalog", "COURSE", "leadDrawer"],
    queryFn: () => apiListCatalogItems({ type: "COURSE" }),
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      apiUpdateLead(lead.id, {
        phone: phone || undefined,
        profession: profession || undefined,
        specialty: specialty || undefined,
        crm: crm || undefined,
        cpf: cpf || undefined,
        clinicName: clinicName || undefined,
        city: city || undefined,
        state: state || undefined,
        leadSource: (leadSource as LeadSource) || undefined,
        courseOfInterestId: courseOfInterestId || null,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast({ kind: "success", title: "Cadastro atualizado" });
    },
    onError: (err) => toast({ kind: "error", title: "Erro ao salvar", description: (err as Error).message }),
  });

  const { data: activities = [] } = useQuery({
    queryKey: ["leadActivities", lead.id],
    queryFn: () => apiListLeadActivities(lead.id),
    enabled: tab === "historico",
  });
  const [activityType, setActivityType] = useState<LeadActivityType>("NOTE");
  const [activityNote, setActivityNote] = useState("");
  const addActivityMutation = useMutation({
    mutationFn: () => apiCreateLeadActivity(lead.id, { type: activityType, note: activityNote }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["leadActivities", lead.id] });
      setActivityNote("");
    },
    onError: (err) => toast({ kind: "error", title: "Erro ao registrar", description: (err as Error).message }),
  });

  const { data: reminders = [] } = useQuery({
    queryKey: ["leadReminders", lead.id],
    queryFn: () => apiListLeadReminders(lead.id),
    enabled: tab === "agenda",
  });
  const [reminderLabel, setReminderLabel] = useState("");
  const [reminderDate, setReminderDate] = useState("");
  const addReminderMutation = useMutation({
    mutationFn: () => apiCreateLeadReminder(lead.id, { label: reminderLabel, dueAt: new Date(reminderDate).toISOString() }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["leadReminders", lead.id] });
      setReminderLabel("");
      setReminderDate("");
    },
    onError: (err) => toast({ kind: "error", title: "Erro ao criar lembrete", description: (err as Error).message }),
  });
  const toggleReminderMutation = useMutation({
    mutationFn: ({ id, done }: { id: string; done: boolean }) => apiUpdateLeadReminder(lead.id, id, done),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["leadReminders", lead.id] }),
  });

  return (
    <div className="fixed inset-0 z-[600]">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="absolute right-0 top-0 flex h-full w-full max-w-[440px] flex-col border-l border-line-strong bg-popover shadow-[var(--shadow-pop)]">
        <div className="flex shrink-0 items-center justify-between border-b border-line px-5 py-4">
          <div className="min-w-0">
            <p className="truncate font-display text-lg text-fg">{lead.name}</p>
            <p className="truncate text-xs text-fg-muted">{lead.email}</p>
          </div>
          <button onClick={onClose} className="shrink-0 text-fg-muted hover:text-fg">
            <X size={18} />
          </button>
        </div>

        <div className="flex shrink-0 gap-1 border-b border-line px-3 pt-2">
          {(["dados", "historico", "agenda"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "rounded-t-md px-3 py-2 text-xs font-medium transition-colors",
                tab === t ? "border-b-2 border-accent text-fg" : "text-fg-muted hover:text-fg",
              )}
            >
              {t === "dados" ? "Cadastro" : t === "historico" ? "Histórico" : "Agenda"}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {tab === "dados" && (
            <form
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                updateMutation.mutate();
              }}
              className="space-y-3"
            >
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="phone">Telefone/WhatsApp</Label>
                  <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="profession">Profissão</Label>
                  <Input id="profession" value={profession} onChange={(e) => setProfession(e.target.value)} placeholder="Médico(a)" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="specialty">Especialidade</Label>
                  <Input id="specialty" value={specialty} onChange={(e) => setSpecialty(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="crm">CRM/CRP/CREFITO</Label>
                  <Input id="crm" value={crm} onChange={(e) => setCrm(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="cpf">CPF</Label>
                  <Input id="cpf" value={cpf} onChange={(e) => setCpf(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="clinicName">Clínica/Consultório</Label>
                  <Input id="clinicName" value={clinicName} onChange={(e) => setClinicName(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="city">Cidade</Label>
                  <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="state">Estado</Label>
                  <Input id="state" value={state} onChange={(e) => setState(e.target.value.toUpperCase())} maxLength={2} />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="leadSource">Origem do lead</Label>
                <select
                  id="leadSource"
                  value={leadSource}
                  onChange={(e) => setLeadSource(e.target.value as LeadSource)}
                  className="h-10 w-full rounded-md border border-line bg-surface-1 px-3 text-sm text-fg focus:border-accent/60 focus:outline-none"
                >
                  <option value="">Não informado</option>
                  {LEAD_SOURCES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="courseOfInterest">Curso de interesse</Label>
                <select
                  id="courseOfInterest"
                  value={courseOfInterestId}
                  onChange={(e) => setCourseOfInterestId(e.target.value)}
                  className="h-10 w-full rounded-md border border-line bg-surface-1 px-3 text-sm text-fg focus:border-accent/60 focus:outline-none"
                >
                  <option value="">Nenhum</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>
              <Button type="submit" className="w-full" loading={updateMutation.isPending}>
                Salvar cadastro
              </Button>
            </form>
          )}

          {tab === "historico" && (
            <div className="space-y-4">
              <form
                onSubmit={(e: FormEvent) => {
                  e.preventDefault();
                  if (!activityNote.trim()) return;
                  addActivityMutation.mutate();
                }}
                className="space-y-2 rounded-lg border border-line p-3"
              >
                <select
                  value={activityType}
                  onChange={(e) => setActivityType(e.target.value as LeadActivityType)}
                  className="h-9 w-full rounded-md border border-line bg-surface-1 px-2 text-xs text-fg focus:border-accent/60 focus:outline-none"
                >
                  {ACTIVITY_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
                <Textarea
                  placeholder="O que aconteceu?"
                  value={activityNote}
                  onChange={(e) => setActivityNote(e.target.value)}
                  rows={2}
                />
                <Button type="submit" size="sm" className="w-full" loading={addActivityMutation.isPending}>
                  Registrar
                </Button>
              </form>

              {activities.length === 0 ? (
                <p className="text-center text-xs text-fg-muted">Nenhum registro ainda.</p>
              ) : (
                <div className="space-y-2.5">
                  {activities.map((a) => {
                    const meta = ACTIVITY_TYPES.find((t) => t.value === a.type);
                    const Icon = meta?.icon ?? StickyNote;
                    return (
                      <div key={a.id} className="flex gap-2.5 rounded-lg border border-line p-3">
                        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
                          <Icon size={12} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-medium text-fg">{meta?.label ?? a.type}</p>
                            <p className="shrink-0 text-[10px] text-fg-muted">{formatDateTime(a.createdAt)}</p>
                          </div>
                          <p className="mt-0.5 whitespace-pre-wrap text-xs text-fg-muted">{a.note}</p>
                          {a.createdByName && <p className="mt-1 text-[10px] text-fg-muted">por {a.createdByName}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {tab === "agenda" && (
            <div className="space-y-4">
              <form
                onSubmit={(e: FormEvent) => {
                  e.preventDefault();
                  if (!reminderLabel.trim() || !reminderDate) return;
                  addReminderMutation.mutate();
                }}
                className="space-y-2 rounded-lg border border-line p-3"
              >
                <Input
                  placeholder="Ex.: Ligar amanhã, cobrar retorno…"
                  value={reminderLabel}
                  onChange={(e) => setReminderLabel(e.target.value)}
                />
                <Input type="datetime-local" value={reminderDate} onChange={(e) => setReminderDate(e.target.value)} />
                <Button type="submit" size="sm" className="w-full" loading={addReminderMutation.isPending}>
                  Adicionar lembrete
                </Button>
              </form>

              {reminders.length === 0 ? (
                <p className="text-center text-xs text-fg-muted">Nenhum lembrete ainda.</p>
              ) : (
                <div className="space-y-2">
                  {reminders.map((r) => (
                    <div
                      key={r.id}
                      className={cn(
                        "flex items-center justify-between gap-2 rounded-lg border border-line p-3",
                        r.done && "opacity-50",
                      )}
                    >
                      <div className="min-w-0">
                        <p className={cn("text-xs font-medium text-fg", r.done && "line-through")}>{r.label}</p>
                        <p className="text-[10px] text-fg-muted">{formatDateTime(r.dueAt)}</p>
                      </div>
                      <button
                        onClick={() => toggleReminderMutation.mutate({ id: r.id, done: !r.done })}
                        className={cn(
                          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border",
                          r.done ? "border-accent bg-accent-soft text-accent" : "border-line text-fg-muted hover:text-fg",
                        )}
                        aria-label="Marcar como feito"
                      >
                        <Check size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Novo contato
// ---------------------------------------------------------------------------

function NewContactModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [form, setForm] = useState<CreateLeadPayload>({ name: "", email: "" });

  const createMutation = useMutation({
    mutationFn: () => apiCreateLead(form),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast({ kind: "success", title: "Contato cadastrado" });
      onClose();
    },
    onError: (err) => toast({ kind: "error", title: "Erro ao cadastrar", description: (err as Error).message }),
  });

  function set<K extends keyof CreateLeadPayload>(key: K, value: CreateLeadPayload[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="fixed inset-0 z-[700] overflow-y-auto p-4">
      <div className="fixed inset-0 bg-black/60" onClick={onClose} />
      <div className="relative mx-auto max-w-lg overflow-hidden rounded-2xl border border-line-strong bg-popover shadow-[var(--shadow-pop)]">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <p className="font-display text-lg text-fg">Novo contato</p>
          <button onClick={onClose} className="text-fg-muted hover:text-fg">
            <X size={18} />
          </button>
        </div>
        <form
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            if (!form.name || !form.email) return;
            createMutation.mutate();
          }}
          className="space-y-3 p-5"
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="nc-name">Nome completo</Label>
              <Input id="nc-name" required value={form.name} onChange={(e) => set("name", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="nc-email">E-mail</Label>
              <Input id="nc-email" type="email" required value={form.email} onChange={(e) => set("email", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="nc-phone">Telefone/WhatsApp</Label>
              <Input id="nc-phone" value={form.phone ?? ""} onChange={(e) => set("phone", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="nc-profession">Profissão</Label>
              <Input id="nc-profession" placeholder="Médico(a)" value={form.profession ?? ""} onChange={(e) => set("profession", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="nc-specialty">Especialidade</Label>
              <Input id="nc-specialty" value={form.specialty ?? ""} onChange={(e) => set("specialty", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="nc-crm">CRM/CRP/CREFITO</Label>
              <Input id="nc-crm" value={form.crm ?? ""} onChange={(e) => set("crm", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="nc-cpf">CPF</Label>
              <Input id="nc-cpf" value={form.cpf ?? ""} onChange={(e) => set("cpf", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="nc-clinic">Clínica/Consultório</Label>
              <Input id="nc-clinic" value={form.clinicName ?? ""} onChange={(e) => set("clinicName", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="nc-city">Cidade</Label>
              <Input id="nc-city" value={form.city ?? ""} onChange={(e) => set("city", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="nc-state">Estado</Label>
              <Input id="nc-state" maxLength={2} value={form.state ?? ""} onChange={(e) => set("state", e.target.value.toUpperCase())} />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="nc-source">Origem do lead</Label>
            <select
              id="nc-source"
              value={form.leadSource ?? ""}
              onChange={(e) => set("leadSource", (e.target.value || undefined) as LeadSource | undefined)}
              className="h-10 w-full rounded-md border border-line bg-surface-1 px-3 text-sm text-fg focus:border-accent/60 focus:outline-none"
            >
              <option value="">Não informado</option>
              {LEAD_SOURCES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <Button type="submit" className="w-full" loading={createMutation.isPending}>
            Cadastrar contato
          </Button>
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Card do kanban
// ---------------------------------------------------------------------------

function LeadCard({ lead, onOpen }: { lead: LeadResponse; onOpen: () => void }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [pendingStage, setPendingStage] = useState<FunnelStage | null>(null);
  const [lossReason, setLossReason] = useState("");

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["leads"] });

  const stageMutation = useMutation({
    mutationFn: ({ stage, reason }: { stage: FunnelStage; reason?: string }) =>
      apiUpdateFunnelStage(lead.id, stage, reason),
    onSuccess: () => {
      invalidate();
      setPendingStage(null);
      setLossReason("");
    },
    onError: (err) => toast({ kind: "error", title: "Erro ao mover lead", description: (err as Error).message }),
  });

  const claimMutation = useMutation({
    mutationFn: () => apiClaimLead(lead.id),
    onSuccess: invalidate,
    onError: (err) => toast({ kind: "error", title: "Erro ao assumir lead", description: (err as Error).message }),
  });

  const reviewMutation = useMutation({
    mutationFn: (action: "APPROVE" | "REJECT") => apiRequestLeadReview(lead.id, action),
    onSuccess: () => {
      invalidate();
      toast({ kind: "success", title: "Solicitação enviada", description: "O gerente vai decidir." });
    },
    onError: (err) => toast({ kind: "error", title: "Erro ao solicitar", description: (err as Error).message }),
  });

  function handleStageChange(value: FunnelStage) {
    if (value === "LOST" || value === "WITHDRAWN") {
      setPendingStage(value);
      return;
    }
    stageMutation.mutate({ stage: value });
  }

  return (
    <Card>
      <CardBody className="space-y-2.5">
        <button onClick={onOpen} className="flex w-full items-start justify-between gap-2 text-left">
          <p className="text-sm font-medium text-fg hover:text-accent">{lead.name}</p>
          {lead.approvalStatus === "IN_REVIEW" && <Badge tone="warn">Em análise</Badge>}
          {lead.approvalStatus === "PENDING" && <Badge tone="muted">Pendente</Badge>}
        </button>
        <p className="truncate text-xs text-fg-muted">{lead.email}</p>
        {(lead.profession || lead.specialty || lead.city) && (
          <p className="text-xs text-fg-muted">
            {[lead.profession, lead.specialty, lead.city].filter(Boolean).join(" · ")}
          </p>
        )}
        {(lead.leadSource || lead.courseOfInterestTitle) && (
          <div className="flex flex-wrap gap-1.5">
            {lead.courseOfInterestTitle && <Badge tone="accent">{lead.courseOfInterestTitle}</Badge>}
            {lead.leadSource && <Badge tone="muted">{sourceLabel(lead.leadSource)}</Badge>}
          </div>
        )}

        <select
          value={lead.funnelStage}
          onChange={(e) => handleStageChange(e.target.value as FunnelStage)}
          disabled={stageMutation.isPending}
          className="h-8 w-full rounded-md border border-line bg-surface-1 px-2 text-xs text-fg focus:border-accent/60 focus:outline-none"
        >
          {STAGES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>

        {pendingStage && (
          <div className="flex items-center gap-1.5">
            <input
              autoFocus
              placeholder="Motivo"
              value={lossReason}
              onChange={(e) => setLossReason(e.target.value)}
              className="h-8 flex-1 rounded-md border border-line bg-surface-1 px-2 text-xs text-fg placeholder:text-fg-muted/70 focus:border-accent/60 focus:outline-none"
            />
            <Button
              size="sm"
              variant="danger"
              onClick={() => stageMutation.mutate({ stage: pendingStage, reason: lossReason })}
            >
              OK
            </Button>
          </div>
        )}

        {!lead.assignedSalesRepId && user?.role === "SALES_REP" && (
          <Button size="sm" variant="secondary" className="w-full" leftIcon={<UserPlus size={12} />} onClick={() => claimMutation.mutate()}>
            Assumir
          </Button>
        )}

        {lead.approvalStatus === "PENDING" && (
          <div className="flex gap-1.5">
            <Button size="sm" variant="secondary" className="flex-1" onClick={() => reviewMutation.mutate("APPROVE")}>
              Solicitar aprovação
            </Button>
            <Button size="sm" variant="secondary" className="flex-1" onClick={() => reviewMutation.mutate("REJECT")}>
              Solicitar rejeição
            </Button>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

function ContactsPage() {
  const { user } = useAuth();
  const [scope, setScope] = useState<"mine" | "unassigned" | "all">(user?.role === "SALES_REP" ? "mine" : "all");
  const [openLeadId, setOpenLeadId] = useState<string | null>(null);
  const [newContactOpen, setNewContactOpen] = useState(false);

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["leads", scope],
    queryFn: () => apiListLeads({ scope }),
  });

  const openLead = leads.find((l) => l.id === openLeadId) ?? null;

  return (
    <PageContainer className="max-w-none">
      <PageHeader
        eyebrow="CRM"
        title="Contatos"
        description="Cadastro completo, histórico e agenda dos leads até virarem clientes."
        action={
          <Button leftIcon={<Plus size={14} />} onClick={() => setNewContactOpen(true)}>
            Novo contato
          </Button>
        }
      />

      {user?.role === "SALES_REP" && (
        <div className="flex gap-2">
          {scopeTabs.map((t) => (
            <button
              key={t.value}
              onClick={() => setScope(t.value)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                scope === t.value
                  ? "border-accent/40 bg-accent-soft text-accent"
                  : "border-line text-fg-muted hover:border-line-strong hover:text-fg",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-fg-muted">Carregando…</p>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STAGES.map((stage) => {
            const stageLeads = leads.filter((l) => l.funnelStage === stage.value);
            return (
              <div key={stage.value} className="w-[280px] shrink-0 space-y-3">
                <div className="flex items-center justify-between px-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-fg-muted">{stage.label}</p>
                  <Badge tone="muted">{stageLeads.length}</Badge>
                </div>
                <div className="space-y-2.5">
                  {stageLeads.map((lead) => (
                    <LeadCard key={lead.id} lead={lead} onOpen={() => setOpenLeadId(lead.id)} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {openLead && <LeadDrawer lead={openLead} onClose={() => setOpenLeadId(null)} />}
      {newContactOpen && <NewContactModal onClose={() => setNewContactOpen(false)} />}
    </PageContainer>
  );
}
