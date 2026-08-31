import { env } from "../../config/env.js";

const appName = () => env.APP_NAME;
const appUrl = () => env.APP_URL;

/**
 * Campos como nome de usuário e motivo de rejeição (digitado por staff) são
 * interpolados direto no HTML do e-mail. Sem escape, um nome/motivo contendo
 * "<img onerror=...>" executaria no cliente de e-mail de quem recebe — inclui
 * casos cross-user (equipe escreve o "reason" que o médico rejeitado lê).
 */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function baseTemplate(content: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${appName()}</title>
  <style>
    body { margin: 0; padding: 0; background: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .wrapper { max-width: 520px; margin: 40px auto; background: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #e5e5e5; }
    .header { background: #0a0a0a; padding: 28px 32px; }
    .header-logo { font-size: 18px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px; margin: 0; }
    .body { padding: 32px; }
    .body h1 { font-size: 20px; font-weight: 600; color: #0a0a0a; margin: 0 0 12px; }
    .body p { font-size: 15px; line-height: 1.6; color: #444444; margin: 0 0 16px; }
    .btn { display: inline-block; background: #0a0a0a; color: #ffffff !important; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-size: 14px; font-weight: 600; margin: 8px 0 20px; }
    .divider { border: none; border-top: 1px solid #e5e5e5; margin: 24px 0; }
    .link-fallback { font-size: 12px; color: #888888; word-break: break-all; }
    .footer { padding: 20px 32px; background: #f9f9f9; border-top: 1px solid #e5e5e5; }
    .footer p { font-size: 12px; color: #888888; margin: 0; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <p class="header-logo">${appName().toLowerCase()}.</p>
    </div>
    <div class="body">
      ${content}
    </div>
    <div class="footer">
      <p>Você está recebendo este e-mail porque se cadastrou em ${appName()}.<br/>
      Se não foi você, ignore esta mensagem.</p>
    </div>
  </div>
</body>
</html>`;
}

export interface ConfirmCodeEmailData {
  name: string;
  code: string;
}

export function confirmCodeTemplate(data: ConfirmCodeEmailData): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = `${data.code} é seu código de verificação — ${appName()}`;
  const html = baseTemplate(`
    <h1>Bem-vindo, ${escapeHtml(data.name)}!</h1>
    <p>Use o código abaixo para confirmar seu endereço de e-mail e ativar sua conta.</p>
    <div style="margin: 24px 0; text-align: center;">
      <div style="display: inline-block; background: #f5f5f5; border: 1px solid #e5e5e5; border-radius: 8px; padding: 16px 32px;">
        <span style="font-size: 36px; font-weight: 700; letter-spacing: 10px; color: #0a0a0a; font-family: monospace;">${data.code}</span>
      </div>
    </div>
    <p style="font-size:13px;color:#888;text-align:center;">Este código expira em <strong>15 minutos</strong>. Não compartilhe com ninguém.</p>
  `);
  const text = `Bem-vindo ao ${appName()}, ${data.name}!\n\nSeu código de verificação é: ${data.code}\n\nO código expira em 15 minutos. Não compartilhe com ninguém.`;
  return { subject, html, text };
}

export interface ResetPasswordEmailData {
  name: string;
  resetUrl: string;
}

export function resetPasswordTemplate(data: ResetPasswordEmailData): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = `Redefinição de senha — ${appName()}`;
  const html = baseTemplate(`
    <h1>Redefinição de senha</h1>
    <p>Olá, ${escapeHtml(data.name)}! Recebemos uma solicitação para redefinir a senha da sua conta.</p>
    <a href="${data.resetUrl}" class="btn">Redefinir senha</a>
    <hr class="divider" />
    <p class="link-fallback">Se o botão não funcionar, copie e cole este link no navegador:<br/>${data.resetUrl}</p>
    <p style="font-size:13px;color:#888;">Este link expira em <strong>1 hora</strong>. Se você não solicitou a redefinição, ignore este e-mail — sua senha permanece a mesma.</p>
  `);
  const text = `Redefinição de senha — ${appName()}\n\nOlá, ${data.name}!\n\nAcesse o link abaixo para redefinir sua senha:\n${data.resetUrl}\n\nO link expira em 1 hora. Se não foi você, ignore este e-mail.`;
  return { subject, html, text };
}

export function buildResetUrl(token: string): string {
  return `${appUrl()}/redefinir-senha?token=${token}`;
}

export interface DoctorNameEmailData {
  name: string;
}

export function doctorPendingApprovalTemplate(data: DoctorNameEmailData): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = `Cadastro recebido — ${appName()}`;
  const html = baseTemplate(`
    <h1>Cadastro recebido, ${escapeHtml(data.name)}!</h1>
    <p>Recebemos seu cadastro como médico e ele já está em análise pela nossa equipe.</p>
    <p>Assim que for aprovado, você receberá um e-mail e já poderá acessar a área exclusiva do médico.</p>
  `);
  const text = `Cadastro recebido — ${appName()}\n\nOlá, ${data.name}!\n\nRecebemos seu cadastro como médico e ele já está em análise. Você será avisado por e-mail assim que for aprovado.`;
  return { subject, html, text };
}

export function doctorApprovedTemplate(data: DoctorNameEmailData): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = `Cadastro aprovado — ${appName()}`;
  const html = baseTemplate(`
    <h1>Parabéns, ${escapeHtml(data.name)}!</h1>
    <p>Seu cadastro foi aprovado. Você já tem acesso à área exclusiva do médico, com catálogo de produtos, cursos e seminários.</p>
    <a href="${appUrl()}/medico" class="btn">Acessar área do médico</a>
  `);
  const text = `Cadastro aprovado — ${appName()}\n\nParabéns, ${data.name}! Seu cadastro foi aprovado.\n\nAcesse: ${appUrl()}/medico`;
  return { subject, html, text };
}

export interface DoctorRejectedEmailData {
  name: string;
  reason?: string;
}

export function doctorRejectedTemplate(data: DoctorRejectedEmailData): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = `Atualização sobre seu cadastro — ${appName()}`;
  const html = baseTemplate(`
    <h1>Olá, ${escapeHtml(data.name)}</h1>
    <p>Analisamos seu cadastro e, no momento, não foi possível aprová-lo.</p>
    ${data.reason ? `<p><strong>Motivo:</strong> ${escapeHtml(data.reason)}</p>` : ""}
    <p>Se você acredita que houve um engano, entre em contato com nossa equipe.</p>
  `);
  const text = `Olá, ${data.name}\n\nAnalisamos seu cadastro e, no momento, não foi possível aprová-lo.${data.reason ? `\n\nMotivo: ${data.reason}` : ""}\n\nSe você acredita que houve um engano, entre em contato com nossa equipe.`;
  return { subject, html, text };
}
