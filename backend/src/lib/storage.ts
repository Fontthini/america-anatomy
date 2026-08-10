import { env } from "../config/env.js";
import { AppError } from "../middlewares/error-handler.js";

function assertConfigured(): void {
  if (!env.BUNNY_STORAGE_ACCESS_KEY || !env.BUNNY_STORAGE_ZONE || !env.BUNNY_CDN_URL) {
    throw new AppError(
      503,
      "STORAGE_NOT_CONFIGURED",
      "Storage de arquivos não configurado. Configure as variáveis BUNNY_* no .env.",
    );
  }
}

function buildStorageUrl(path: string): string {
  const region = env.BUNNY_STORAGE_REGION;
  const zone = env.BUNNY_STORAGE_ZONE;
  // Garante que o path não começa com barra
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  return `https://${region}/${zone}/${cleanPath}`;
}

/**
 * Faz upload de um arquivo para o Bunny.net Edge Storage.
 * @param path  Caminho dentro da storage zone (ex: "avatars/user123")
 * @param buffer Conteúdo binário do arquivo
 * @param contentType MIME type (ex: "image/jpeg")
 * @returns URL pública do arquivo via CDN pull zone
 */
export async function uploadFile(
  path: string,
  buffer: Buffer,
  contentType: string,
): Promise<string> {
  assertConfigured();

  const url = buildStorageUrl(path);

  const response = await fetch(url, {
    method: "PUT",
    headers: {
      AccessKey: env.BUNNY_STORAGE_ACCESS_KEY,
      "Content-Type": contentType,
    },
    body: buffer,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new AppError(
      502,
      "STORAGE_UPLOAD_FAILED",
      `Falha ao fazer upload do arquivo (${response.status}): ${text}`,
    );
  }

  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  return `${env.BUNNY_CDN_URL.replace(/\/$/, "")}/${cleanPath}`;
}

/**
 * Remove um arquivo do Bunny.net Edge Storage.
 * Silencioso em caso de 404 (arquivo já não existe).
 * @param path Caminho dentro da storage zone (ex: "avatars/user123")
 */
export async function deleteFile(path: string): Promise<void> {
  assertConfigured();

  const url = buildStorageUrl(path);

  const response = await fetch(url, {
    method: "DELETE",
    headers: { AccessKey: env.BUNNY_STORAGE_ACCESS_KEY },
  });

  if (!response.ok && response.status !== 404) {
    console.error(`[storage] Falha ao deletar arquivo ${path}: ${response.status}`);
  }
}

/**
 * Extrai o path relativo da storage zone a partir de uma URL CDN pública.
 * Útil para deletar o arquivo antigo ao trocar o avatar.
 * @param cdnUrl URL pública (ex: https://meu-pullzone.b-cdn.net/avatars/user123)
 * @returns Path relativo (ex: "avatars/user123") ou null se não for uma URL Bunny
 */
export function extractPathFromCdnUrl(cdnUrl: string): string | null {
  if (!env.BUNNY_CDN_URL) return null;
  const base = env.BUNNY_CDN_URL.replace(/\/$/, "");
  if (!cdnUrl.startsWith(base)) return null;
  return cdnUrl.slice(base.length + 1); // remove a barra inicial
}
