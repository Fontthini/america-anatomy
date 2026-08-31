import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { AuthSplit } from "../components/layout/AuthSplit";
import { Button } from "../components/ui/Button";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { apiConfirmEmail, apiResendConfirmation } from "../lib/api/auth";
import { ApiError } from "../lib/api/client";
import { CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/verificar-email")({
  head: () => ({ meta: [{ title: "Verificar e-mail — Base" }] }),
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    if (!localStorage.getItem("bp.token")) {
      throw redirect({ to: "/login" });
    }
  },
  component: VerifyEmailPage,
});

const CODE_LENGTH = 6;
const RESEND_COOLDOWN = 60; // segundos

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  const visible = local.slice(0, 2);
  return `${visible}${"*".repeat(Math.max(local.length - 2, 3))}@${domain}`;
}

function VerifyEmailPage() {
  const { user, status, updateProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [sendingResend, setSendingResend] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Se já verificado, redireciona para o dashboard
  useEffect(() => {
    if (status === "authenticated" && user?.emailVerified) {
      void navigate({ to: "/dashboard" });
    }
    if (status === "unauthenticated") {
      void navigate({ to: "/login" });
    }
  }, [status, user, navigate]);

  // Countdown do cooldown de reenvio
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  function focusInput(index: number) {
    inputRefs.current[index]?.focus();
  }

  function handleChange(index: number, value: string) {
    // Aceita apenas dígitos; se colar código completo, distribui pelos inputs
    const sanitized = value.replace(/\D/g, "");
    if (sanitized.length > 1) {
      // Paste: distribui os dígitos a partir do índice atual
      const next = [...digits];
      for (let i = 0; i < sanitized.length && index + i < CODE_LENGTH; i++) {
        next[index + i] = sanitized[i];
      }
      setDigits(next);
      const nextFocus = Math.min(index + sanitized.length, CODE_LENGTH - 1);
      focusInput(nextFocus);
      // Auto-submit se todos preenchidos
      if (next.every((d) => d !== "")) {
        void submitCode(next.join(""));
      }
      return;
    }

    const next = [...digits];
    next[index] = sanitized;
    setDigits(next);
    setError(null);

    if (sanitized && index < CODE_LENGTH - 1) {
      focusInput(index + 1);
    }

    // Auto-submit ao preencher o último dígito
    if (sanitized && index === CODE_LENGTH - 1) {
      const code = next.join("");
      if (code.length === CODE_LENGTH) {
        void submitCode(code);
      }
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      focusInput(index - 1);
    }
  }

  async function submitCode(code: string) {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      await apiConfirmEmail(user?.email ?? "", code);
      // Atualiza o AuthContext imediatamente para evitar redirect loop no guard do _app.tsx
      updateProfile({ emailVerified: true });
      setDone(true);
      setTimeout(() => void navigate({ to: "/dashboard" }), 1500);
    } catch (err) {
      let msg = "Código inválido. Tente novamente.";
      if (err instanceof ApiError) {
        if (err.code === "CODE_EXPIRED") msg = "Código expirado. Solicite um novo.";
        else if (err.code === "CODE_ALREADY_USED") msg = "Código já utilizado. Solicite um novo.";
      }
      setError(msg);
      // Limpa os inputs para nova tentativa
      setDigits(Array(CODE_LENGTH).fill(""));
      setTimeout(() => focusInput(0), 50);
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (!user || cooldown > 0 || sendingResend) return;
    setSendingResend(true);
    try {
      await apiResendConfirmation(user.email);
      toast({ kind: "success", title: "Código reenviado", description: `Verifique ${maskEmail(user.email)}.` });
      setCooldown(RESEND_COOLDOWN);
      setDigits(Array(CODE_LENGTH).fill(""));
      setError(null);
      setTimeout(() => focusInput(0), 50);
    } catch {
      toast({ kind: "error", title: "Falha ao reenviar", description: "Tente novamente." });
    } finally {
      setSendingResend(false);
    }
  }

  if (status === "loading") return null;

  const email = user?.email ?? "";

  return (
    <AuthSplit quote="One step away." caption="Confirme seu e-mail para acessar o app.">
      <div className="space-y-8">
        {done ? (
          <div className="space-y-6">
            <CheckCircle2 size={28} strokeWidth={1.25} className="text-accent" />
            <div>
              <h1 className="font-display text-3xl text-fg">E-mail confirmado!</h1>
              <p className="mt-2 text-sm text-fg-muted">Redirecionando para o dashboard...</p>
            </div>
          </div>
        ) : (
          <>
            <div>
              <h1 className="font-display text-4xl text-fg">Verifique seu e-mail</h1>
              <p className="mt-2 text-sm text-fg-muted">
                Enviamos um código de 6 dígitos para{" "}
                <span className="text-fg">{maskEmail(email)}</span>.
              </p>
            </div>

            {/* 6 inputs individuais */}
            <div className="space-y-4">
              <div className="flex gap-2">
                {digits.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { inputRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={digit}
                    onChange={(e) => handleChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    onFocus={(e) => e.target.select()}
                    disabled={loading}
                    className="h-14 w-full rounded-lg border border-line bg-surface-1 text-center text-xl font-semibold text-fg caret-transparent focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-50"
                    aria-label={`Dígito ${i + 1}`}
                    autoFocus={i === 0}
                  />
                ))}
              </div>

              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}

              <Button
                type="button"
                loading={loading}
                className="w-full"
                onClick={() => {
                  const code = digits.join("");
                  if (code.length === CODE_LENGTH) void submitCode(code);
                }}
                disabled={digits.join("").length < CODE_LENGTH}
              >
                Verificar
              </Button>
            </div>

            {/* Reenviar código */}
            <div className="text-center text-sm text-fg-muted">
              Não recebeu?{" "}
              <button
                onClick={handleResend}
                disabled={cooldown > 0 || sendingResend}
                className="text-fg underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
              >
                {cooldown > 0
                  ? `Reenviar em ${cooldown}s`
                  : sendingResend
                    ? "Enviando..."
                    : "Reenviar código"}
              </button>
            </div>
          </>
        )}
      </div>
    </AuthSplit>
  );
}
