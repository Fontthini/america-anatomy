import { resend } from "./client.js";
import { env } from "../../config/env.js";

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Envia um e-mail via Resend.
 * Erros de envio são logados mas não propagados — e-mail é best-effort,
 * exceto em fluxos que dependem explicitamente da entrega.
 */
export async function sendEmail(opts: SendEmailOptions): Promise<void> {
  try {
    const { error } = await resend.emails.send({
      from: env.EMAIL_FROM,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
    });
    if (error) {
      console.error("[email] Falha ao enviar e-mail:", error);
    }
  } catch (err) {
    console.error("[email] Exceção ao enviar e-mail:", err);
  }
}
