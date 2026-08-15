/**
 * Adresse du client, telle que la pose le proxy Vercel. `x-real-ip` est
 * écrasé à son bord à chaque requête : un client qui envoie l'en-tête
 * lui-même ne se choisit pas son IP. Les en-têtes que le client contrôle
 * (`x-forwarded-for` brut) ne sont volontairement pas lus.
 *
 * En local il n'y a pas de proxy : la fonction renvoie null, ce qui est la
 * bonne réponse — mieux vaut « inconnue » qu'une valeur inventée.
 */
export function clientIp(headers: Headers): string | null {
  return headers.get("x-real-ip")?.trim() || null;
}
