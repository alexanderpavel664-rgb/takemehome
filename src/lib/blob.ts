import { del } from "@vercel/blob";
import { logError } from "@/lib/log";

/**
 * Suppression de photos dans le store Vercel Blob — nettoyage best-effort.
 *
 * La base fait foi : un échec réseau ici ne doit jamais faire échouer
 * l'action qui l'appelle (le blob orphelin n'est plus référencé nulle part).
 * del() est idempotent côté Vercel. Log seul, sans alerte : un blob orphelin
 * ne coûte que du stockage et n'empêche personne de publier — alerter ne
 * ferait que du bruit.
 *
 * Vit dans son propre module et non dans animal-photo.ts : ce dernier est
 * importé par next.config.ts (BLOB_HOST), et y ajouter le SDK Vercel Blob
 * le ferait entrer dans la configuration de build.
 */
export async function deleteBlobs(urls: string[]): Promise<void> {
  if (urls.length === 0) {
    return;
  }
  try {
    await del(urls);
  } catch (error) {
    logError("blob.delete_failed", error, { count: urls.length });
  }
}
