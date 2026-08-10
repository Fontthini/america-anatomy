import { NotificationType } from "@prisma/client";
import { prisma } from "./prisma.js";

export { NotificationType };

type NotificationContent = { title: string; body: string };

const NOTIFICATION_CONTENT: Record<NotificationType, NotificationContent> = {
  WELCOME: {
    title: "Bem-vindo!",
    body: "Sua conta foi criada com sucesso. Explore o sistema.",
  },
  EMAIL_VERIFIED: {
    title: "E-mail confirmado",
    body: "Seu endereço de e-mail foi verificado com sucesso.",
  },
  PASSWORD_CHANGED: {
    title: "Senha alterada",
    body: "Sua senha foi redefinida com sucesso.",
  },
  PASSWORD_RESET_REQUESTED: {
    title: "Redefinição solicitada",
    body: "Um link para redefinição de senha foi enviado para seu e-mail.",
  },
  PROFILE_UPDATED: {
    title: "Perfil atualizado",
    body: "Suas informações de perfil foram salvas com sucesso.",
  },
  AVATAR_UPDATED: {
    title: "Foto atualizada",
    body: "Sua foto de perfil foi alterada com sucesso.",
  },
  DOCTOR_REGISTRATION_RECEIVED: {
    title: "Cadastro recebido",
    body: "Recebemos seu cadastro de médico. Ele está em análise pela nossa equipe.",
  },
  NEW_DOCTOR_PENDING: {
    title: "Novo médico aguardando aprovação",
    body: "Um novo cadastro de médico foi recebido e aguarda análise.",
  },
  DOCTOR_APPROVED: {
    title: "Cadastro aprovado",
    body: "Seu cadastro foi aprovado! Você já tem acesso à área do médico.",
  },
  DOCTOR_REJECTED: {
    title: "Cadastro não aprovado",
    body: "Seu cadastro não foi aprovado. Confira os detalhes enviados por e-mail.",
  },
  ORDER_CREATED: {
    title: "Pedido confirmado",
    body: "Seu pedido/inscrição foi confirmado com sucesso.",
  },
};

/**
 * Cria uma notificação para o usuário.
 * Silencioso em caso de erro — nunca deve bloquear o fluxo principal.
 */
export async function createNotification(
  userId: string,
  type: NotificationType,
): Promise<void> {
  try {
    const content = NOTIFICATION_CONTENT[type];
    await prisma.notification.create({
      data: {
        userId,
        type,
        title: content.title,
        body: content.body,
      },
    });
  } catch (err) {
    console.error(`[notifications] Falha ao criar notificação ${type} para ${userId}:`, err);
  }
}
