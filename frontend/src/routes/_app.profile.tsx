import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Card, CardBody } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Label } from "../components/ui/Label";
import { Textarea } from "../components/ui/Textarea";
import { Button } from "../components/ui/Button";
import { Avatar } from "../components/ui/Avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/Tabs";
import { Checkbox } from "../components/ui/Checkbox";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { useTheme } from "../contexts/ThemeContext";
import { mockDelay } from "../lib/mock";
import { Upload } from "lucide-react";
import { PageContainer, PageHeader } from "../components/layout/PageContainer";
import { apiUpdateProfile, apiUploadAvatar, apiUpdatePreferences } from "../lib/api/users";
import { ApiError } from "../lib/api/client";

export const Route = createFileRoute("/_app/profile")({
  head: () => ({ meta: [{ title: "Perfil — Base" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const { toast } = useToast();

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Conta"
        title="Perfil"
        description="Gerencie suas informações, segurança e preferências."
      />

      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">Dados pessoais</TabsTrigger>
          <TabsTrigger value="security">Segurança</TabsTrigger>
          <TabsTrigger value="prefs">Preferências</TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <PersonalForm
            initialName={user?.name ?? ""}
            initialEmail={user?.email ?? ""}
            initialBio={user?.bio ?? ""}
            initialAvatar={user?.avatarUrl}
            onSaveProfile={async (data) => {
              const updated = await apiUpdateProfile({ name: data.name, bio: data.bio || undefined });
              updateProfile(updated);
              toast({
                kind: "success",
                title: "Perfil atualizado",
                description: "Suas alterações foram salvas.",
              });
            }}
            onSaveAvatar={async (file) => {
              const updated = await apiUploadAvatar(file);
              updateProfile(updated);
            }}
          />
        </TabsContent>

        <TabsContent value="security">
          <SecurityForm
            onSave={async () => {
              await mockDelay(600);
              toast({ kind: "success", title: "Senha atualizada" });
            }}
          />
        </TabsContent>

        <TabsContent value="prefs">
          <Preferences />
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}

function getUploadErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    switch (err.code) {
      case "FILE_TOO_LARGE":
        return "Arquivo muito grande. Máximo: 2 MB.";
      case "INVALID_FILE_TYPE":
        return "Formato não suportado. Use JPG, PNG ou WebP.";
      case "STORAGE_UPLOAD_FAILED":
        return "Falha ao enviar para o servidor. Tente novamente.";
      case "STORAGE_NOT_CONFIGURED":
        return "Upload indisponível no momento.";
      default:
        return err.message;
    }
  }
  return (err as Error).message ?? "Erro desconhecido.";
}

function PersonalForm({
  initialName,
  initialEmail,
  initialBio,
  initialAvatar,
  onSaveProfile,
  onSaveAvatar,
}: {
  initialName: string;
  initialEmail: string;
  initialBio: string;
  initialAvatar?: string;
  onSaveProfile: (data: { name: string; bio: string }) => Promise<void>;
  onSaveAvatar: (file: File) => Promise<void>;
}) {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(initialName);
  const [bio, setBio] = useState(initialBio);
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>(initialAvatar);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  // Rastreia a URL do último avatar salvo para reverter corretamente em caso de erro
  const lastSavedAvatar = useRef(initialAvatar);

  // Sincroniza o preview com a URL real quando o contexto atualiza (após salvar ou troca de sessão)
  useEffect(() => {
    if (!pendingFile) {
      setAvatarPreview(initialAvatar);
      lastSavedAvatar.current = initialAvatar;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialAvatar]);

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const MAX_SIZE = 2 * 1024 * 1024; // 2 MB
    const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

    if (file.size > MAX_SIZE) {
      toast({
        kind: "error",
        title: "Arquivo muito grande",
        description: "Máximo: 2 MB. Escolha uma imagem menor.",
      });
      e.target.value = "";
      return;
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast({
        kind: "error",
        title: "Formato inválido",
        description: "Use JPG, PNG ou WebP.",
      });
      e.target.value = "";
      return;
    }

    // Guarda o arquivo e mostra preview local — o upload acontece no Salvar
    setPendingFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    e.target.value = "";
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    const profileChanged = name !== initialName || bio !== initialBio;
    try {
      // Se há foto nova selecionada, envia primeiro
      if (pendingFile) {
        try {
          await onSaveAvatar(pendingFile);
          setPendingFile(null);
          // O useEffect vai sincronizar o preview quando initialAvatar propagar do contexto.
        } catch (err) {
          toast({ kind: "error", title: "Falha no upload da foto", description: getUploadErrorMessage(err) });
          setAvatarPreview(lastSavedAvatar.current);
          setPendingFile(null);
          return;
        }
      }
      // Só chama o endpoint de perfil se algo realmente mudou
      if (profileChanged) {
        await onSaveProfile({ name, bio });
      }
      if (pendingFile || profileChanged) {
        toast({
          kind: "success",
          title: "Perfil salvo",
          description: "Suas alterações foram salvas com sucesso.",
        });
      }
    } catch (err) {
      if (err instanceof ApiError) {
        toast({ kind: "error", title: "Erro ao salvar", description: err.message });
      } else {
        toast({ kind: "error", title: "Erro ao salvar", description: (err as Error).message });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardBody>
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar name={name || "?"} src={avatarPreview} size={56} />
            <div className="space-y-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                leftIcon={<Upload size={14} strokeWidth={1.5} />}
                onClick={() => fileRef.current?.click()}
              >
                {pendingFile ? "Trocar foto" : "Trocar avatar"}
              </Button>
              <p className="text-xs text-fg-muted">
                {pendingFile
                  ? "Foto selecionada — clique em Salvar para confirmar."
                  : "PNG, JPG ou WebP, até 2 MB."}
              </p>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={onPick}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="pname">Nome</Label>
              <Input id="pname" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pemail">E-mail</Label>
              <Input
                id="pemail"
                type="email"
                value={initialEmail}
                readOnly
                className="cursor-not-allowed opacity-60"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bio">Bio</Label>
            <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} />
          </div>

          <div className="flex justify-end">
            <Button type="submit" loading={loading}>
              Salvar alterações
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}

function SecurityForm({ onSave }: { onSave: () => Promise<void> }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (!current) err.current = "Informe a senha atual.";
    if (next.length < 8) err.next = "Mínimo 8 caracteres.";
    if (next !== confirm) err.confirm = "As senhas não coincidem.";
    setErrors(err);
    if (Object.keys(err).length) return;
    setLoading(true);
    try {
      await onSave();
      setCurrent(""); setNext(""); setConfirm("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardBody>
        <form onSubmit={onSubmit} className="grid grid-cols-1 gap-5 md:max-w-md">
          <div className="space-y-1.5">
            <Label htmlFor="cur">Senha atual</Label>
            <Input id="cur" type="password" value={current} onChange={(e) => setCurrent(e.target.value)} error={errors.current} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new">Nova senha</Label>
            <Input id="new" type="password" value={next} onChange={(e) => setNext(e.target.value)} error={errors.next} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cnf">Confirmar nova senha</Label>
            <Input id="cnf" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} error={errors.confirm} />
          </div>
          <div className="flex justify-end">
            <Button type="submit" loading={loading}>Atualizar senha</Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}

function Preferences() {
  const { user, updateProfile } = useAuth();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const [emailNotif, setEmailNotif] = useState(user?.emailNotifications ?? true);
  const [productUpdatesVal, setProductUpdatesVal] = useState(user?.productUpdates ?? false);
  const [saving, setSaving] = useState<"emailNotifications" | "productUpdates" | null>(null);

  async function toggle(field: "emailNotifications" | "productUpdates", value: boolean) {
    const prev = field === "emailNotifications" ? emailNotif : productUpdatesVal;
    // Optimistic update
    if (field === "emailNotifications") setEmailNotif(value);
    else setProductUpdatesVal(value);
    setSaving(field);
    try {
      const updated = await apiUpdatePreferences({ [field]: value });
      updateProfile(updated);
    } catch {
      // Reverter em caso de erro
      if (field === "emailNotifications") setEmailNotif(prev);
      else setProductUpdatesVal(prev);
      toast({ kind: "error", title: "Erro ao salvar preferência", description: "Tente novamente." });
    } finally {
      setSaving(null);
    }
  }

  return (
    <Card>
      <CardBody className="space-y-6">
        <Row title="Notificações por e-mail" desc="Receba resumos diários sobre sua conta.">
          <Checkbox
            checked={emailNotif}
            disabled={saving === "emailNotifications"}
            onChange={(e) => void toggle("emailNotifications", e.target.checked)}
            label={saving === "emailNotifications" ? "Salvando…" : "Ativado"}
          />
        </Row>
        <div className="h-px bg-line" />
        <Row title="Novidades do produto" desc="Atualizações importantes do boilerplate.">
          <Checkbox
            checked={productUpdatesVal}
            disabled={saving === "productUpdates"}
            onChange={(e) => void toggle("productUpdates", e.target.checked)}
            label={saving === "productUpdates" ? "Salvando…" : "Ativado"}
          />
        </Row>
        <div className="h-px bg-line" />
        <Row title="Tema" desc="Alterne entre o tema claro e escuro.">
          <Checkbox
            checked={theme === "light"}
            onChange={(e) => setTheme(e.target.checked ? "light" : "dark")}
            label={theme === "light" ? "Claro" : "Escuro"}
          />
        </Row>
      </CardBody>
    </Card>
  );
}

function Row({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-sm text-fg">{title}</p>
        <p className="text-xs text-fg-muted">{desc}</p>
      </div>
      <div>{children}</div>
    </div>
  );
}