/**
 * Balise d'erreur navigateur — l'alternative maison au SDK Sentry client.
 *
 * Pourquoi elle existe : l'upload de photo part du navigateur DIRECTEMENT
 * vers Vercel Blob (c'est ce qui contourne la limite de 4,5 Mo des fonctions
 * Vercel). S'il échoue, le serveur ne l'apprend jamais — or c'est le moment
 * précis où un sauveteur abandonne. Même chose pour un plantage de rendu
 * React : il n'a laissé aucune trace côté serveur.
 *
 * Pourquoi pas le SDK Sentry navigateur : ~30 Ko gzip sur des téléphones en
 * 4G roumaine. Ce fichier pèse quelques centaines d'octets et poste vers
 * /api/client-error, qui relaie à Sentry côté serveur.
 *
 * Contrepartie assumée : seul ce qui est instrumenté explicitement remonte.
 * Une erreur JS quelconque ailleurs dans la page passe inaperçue.
 */

/** Liste fermée — la route rejette tout ce qui n'y figure pas. */
export const CLIENT_ERROR_EVENTS = [
  "photo_upload_failed",
  "photo_prepare_failed",
  "render_crashed",
] as const;

export type ClientErrorEvent = (typeof CLIENT_ERROR_EVENTS)[number];

const ENDPOINT = "/api/client-error";

/**
 * Envoi au mieux : ne jette jamais, ne renvoie rien, ne bloque pas le rendu.
 * Si le réseau est coupé, l'envoi est perdu — il n'y a rien à faire de mieux
 * depuis un navigateur hors ligne.
 *
 * `context` ne doit contenir que des valeurs écrites par nous. Jamais de
 * saisie utilisateur, jamais de téléphone ni d'email.
 */
export function reportClientError(
  event: ClientErrorEvent,
  error: unknown,
  context?: Record<string, string | number>,
): void {
  try {
    const body = JSON.stringify({
      event,
      message: (error instanceof Error ? error.message : String(error)).slice(0, 300),
      stack: error instanceof Error && error.stack ? error.stack.slice(0, 2000) : undefined,
      path: window.location.pathname,
      context,
    });

    // sendBeacon survit à une navigation ou à la fermeture de l'onglet : un
    // utilisateur qui abandonne après l'échec est justement le cas à couvrir.
    const blob = new Blob([body], { type: "application/json" });
    if (navigator.sendBeacon?.(ENDPOINT, blob)) {
      return;
    }
    void fetch(ENDPOINT, {
      method: "POST",
      body,
      headers: { "Content-Type": "application/json" },
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Une balise de diagnostic ne casse jamais la page qu'elle observe.
  }
}
