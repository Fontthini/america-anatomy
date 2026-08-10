import { createHash, randomBytes, randomInt } from "crypto";

/** Gera um token aleatório forte e seu hash SHA-256 (usado em links de reset de senha). */
export function generateToken(): { raw: string; hash: string } {
  const raw = randomBytes(32).toString("hex");
  const hash = hashToken(raw);
  return { raw, hash };
}

/** Gera um código OTP de 6 dígitos e seu hash SHA-256 (usado em verificação de e-mail).
 *  Retorna { raw, hash } para ser compatível com a interface de generateToken(). */
export function generateOtpCode(): { raw: string; hash: string } {
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  return { raw: code, hash: hashToken(code) };
}

/** Hasheia um valor com SHA-256 para comparação segura. */
export function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}
