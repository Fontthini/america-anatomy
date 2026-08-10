import { prisma } from "./prisma.js";

/**
 * Registra uma ação de auditoria do CRM (funil, indicações, financeiro, equipe).
 * Silencioso em caso de erro — nunca deve bloquear o fluxo principal.
 */
export async function createAuditLog(
  actor: { id: string; name: string; role: string } | undefined,
  action: string,
  detail?: string,
): Promise<void> {
  if (!actor) return;
  try {
    await prisma.auditLog.create({
      data: {
        actorUserId: actor.id,
        actorLabel: `${actor.name} (${actor.role})`,
        action,
        ...(detail ? { detail } : {}),
      },
    });
  } catch (err) {
    console.error(`[audit-log] Falha ao registrar ${action}:`, err);
  }
}
