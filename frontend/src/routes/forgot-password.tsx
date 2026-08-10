import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { AuthSplit } from "../components/layout/AuthSplit";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Label } from "../components/ui/Label";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { CheckCircle2, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Recuperar senha — Base" }] }),
  component: ForgotPage,
});

function ForgotPage() {
  const { requestPasswordReset } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(ev: FormEvent) {
    ev.preventDefault();
    setError(undefined);
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("E-mail inválido.");
      return;
    }
    setLoading(true);
    try {
      await requestPasswordReset(email);
      setSent(true);
    } catch (err) {
      toast({ kind: "error", title: "Falha ao enviar", description: (err as Error).message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthSplit quote="A clean slate, instantly." caption="Vamos te ajudar a recuperar o acesso.">
      <div className="space-y-8">
        {sent ? (
          <div className="space-y-6">
            <CheckCircle2 size={28} strokeWidth={1.25} className="text-accent" />
            <div>
              <h1 className="font-display text-3xl text-fg">Confira seu e-mail</h1>
              <p className="mt-2 text-sm text-fg-muted">
                Enviamos um link para <span className="text-fg">{email}</span>. Use-o para criar uma nova senha.
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                leftIcon={<ArrowLeft size={14} strokeWidth={1.5} />}
                onClick={() => navigate({ to: "/login" })}
              >
                Voltar ao login
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div>
              <h1 className="font-display text-4xl text-fg">Esqueci a senha</h1>
              <p className="mt-2 text-sm text-fg-muted">Informe seu e-mail e enviaremos um link.</p>
            </div>
            <form onSubmit={onSubmit} className="space-y-5" noValidate>
              <div className="space-y-1.5">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={error}
                />
              </div>
              <Button type="submit" loading={loading} className="w-full">
                Enviar link
              </Button>
              <p className="text-center text-sm text-fg-muted">
                Lembrou?{" "}
                <Link to="/login" className="text-fg underline-offset-4 hover:underline">
                  Voltar ao login
                </Link>
              </p>
            </form>
          </>
        )}
      </div>
    </AuthSplit>
  );
}