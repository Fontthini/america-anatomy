import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import { AuthSplit } from "../components/layout/AuthSplit";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Label } from "../components/ui/Label";
import { PasswordStrength } from "../components/ui/PasswordStrength";
import { useToast } from "../contexts/ToastContext";
import { apiResetPassword } from "../lib/api/auth";
import { ApiError } from "../lib/api/client";
import { CheckCircle2, XCircle } from "lucide-react";

const searchSchema = z.object({
  token: z.string().optional(),
});

export const Route = createFileRoute("/redefinir-senha")({
  head: () => ({ meta: [{ title: "Nova senha — Base" }] }),
  validateSearch: searchSchema,
  component: ResetPage,
});

function ResetPage() {
  const { token } = Route.useSearch();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);

  if (!token) {
    return (
      <AuthSplit quote="A fresh start." caption="Redefina sua senha.">
        <div className="space-y-6">
          <XCircle size={28} strokeWidth={1.25} className="text-red-500" />
          <div>
            <h1 className="font-display text-3xl text-fg">Link inválido</h1>
            <p className="mt-2 text-sm text-fg-muted">
              Acesse o link enviado para o seu e-mail para redefinir a senha.
            </p>
          </div>
          <Link to="/forgot-password">
            <Button className="w-full">Solicitar novo link</Button>
          </Link>
        </div>
      </AuthSplit>
    );
  }

  async function onSubmit(ev: FormEvent) {
    ev.preventDefault();
    const e: Record<string, string> = {};
    if (password.length < 8) e.password = "Mínimo 8 caracteres.";
    if (confirm !== password) e.confirm = "As senhas não coincidem.";
    setErrors(e);
    if (Object.keys(e).length) return;

    setLoading(true);
    try {
      await apiResetPassword(token!, password);
      setDone(true);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === "TOKEN_ALREADY_USED") {
          setTokenError("Este link já foi utilizado. Solicite um novo.");
        } else if (err.code === "TOKEN_EXPIRED") {
          setTokenError("Este link expirou. Solicite um novo.");
        } else if (err.code === "PASSWORD_ALREADY_USED") {
          setErrors((prev) => ({
            ...prev,
            password: "Você já usou essa senha recentemente. Escolha uma diferente.",
          }));
        } else {
          setTokenError("Link inválido.");
        }
      } else {
        toast({ kind: "error", title: "Falha", description: (err as Error).message });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthSplit quote="A fresh start." caption="Defina uma nova senha para sua conta.">
      <div className="space-y-8">
        {tokenError && (
          <div className="space-y-6">
            <XCircle size={28} strokeWidth={1.25} className="text-red-500" />
            <div>
              <h1 className="font-display text-3xl text-fg">Link inválido</h1>
              <p className="mt-2 text-sm text-fg-muted">{tokenError}</p>
            </div>
            <Link to="/forgot-password">
              <Button className="w-full">Solicitar novo link</Button>
            </Link>
          </div>
        )}

        {done && !tokenError && (
          <div className="space-y-6">
            <CheckCircle2 size={28} strokeWidth={1.25} className="text-accent" />
            <div>
              <h1 className="font-display text-3xl text-fg">Senha atualizada!</h1>
              <p className="mt-2 text-sm text-fg-muted">
                Sua senha foi redefinida com sucesso. Faça login com a nova senha.
              </p>
            </div>
            <Button onClick={() => void navigate({ to: "/login" })} className="w-full">
              Ir para login
            </Button>
          </div>
        )}

        {!done && !tokenError && (
          <>
            <div>
              <h1 className="font-display text-4xl text-fg">Nova senha</h1>
              <p className="mt-2 text-sm text-fg-muted">
                Crie uma senha segura com pelo menos 8 caracteres.
              </p>
            </div>
            <form onSubmit={onSubmit} className="space-y-5" noValidate>
              <div className="space-y-1.5">
                <Label htmlFor="pw">Nova senha</Label>
                <Input
                  id="pw"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  error={errors.password}
                />
                <PasswordStrength value={password} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cpw">Confirmar senha</Label>
                <Input
                  id="cpw"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  error={errors.confirm}
                />
              </div>
              <Button type="submit" loading={loading} className="w-full">
                Atualizar senha
              </Button>
            </form>
          </>
        )}
      </div>
    </AuthSplit>
  );
}
