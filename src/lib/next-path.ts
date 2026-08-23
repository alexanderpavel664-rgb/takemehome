/**
 * Chemin de retour après connexion : `/login?next=<chemin>`.
 *
 * Seul un chemin relatif au site est accepté. `//evil.ro`, `/\evil.ro` ou
 * `https://…` renverraient la personne hors du site juste après qu'elle a
 * tapé son mot de passe — le schéma classique de l'hameçonnage par
 * redirection ouverte. Tout ce qui n'est pas un chemin interne retombe sur
 * le repli, sans message : un paramètre forgé ne mérite pas d'explication.
 */
export function safeNextPath(
  raw: string | undefined,
  fallback = "/cont",
): string {
  if (!raw || !raw.startsWith("/") || /^\/[/\\]/.test(raw)) {
    return fallback;
  }
  return raw;
}

/** Lien vers la connexion qui ramène ensuite sur `next`. */
export function loginHref(next: string): string {
  return `/login?next=${encodeURIComponent(next)}`;
}
