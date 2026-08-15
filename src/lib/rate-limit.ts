import { checkRateLimit } from "@vercel/firewall";
import { clientIp } from "@/lib/client-ip";
import { logError } from "@/lib/log";

// Limite de débit des routes hors auth (l'auth a la sienne, intégrée à
// better-auth — voir auth.ts). Le compteur vit dans le WAF Vercel : chaque
// appel coûte un aller-retour HTTPS vers son point de contrôle (la fonction
// est bien invoquée), mais une requête rejetée l'est avant la session et
// tout Prisma — zéro requête Neon.
//
// Le plan Hobby n'autorise qu'UNE règle de rate limit : les préfixes de
// seau (upload:<ip>, animal-write:<ip>, report:<ip>) créent des compteurs
// distincts sous cette règle unique. À configurer une fois dans le dashboard :
// Projet → Firewall → + New Rule → condition « @vercel/firewall »,
// Rate limit ID « app-api », Fixed Window 60 s / 20 requêtes, action
// Deny → Publish. Tant que la règle n'existe pas (et en local), le
// contrôle est transparent (rateLimited: false + avertissement console).
const RULE_ID = "app-api";

export async function isRateLimited(
  bucket: "upload" | "animal-write" | "client-error" | "report",
  headers: Headers,
): Promise<boolean> {
  const ip = clientIp(headers) ?? "anon";
  try {
    const { rateLimited } = await checkRateLimit(RULE_ID, {
      headers,
      rateLimitKey: `${bucket}:${ip}`,
    });
    return rateLimited;
  } catch (error) {
    // checkRateLimit jette sur un 5xx du WAF ou une erreur réseau : un
    // hoquet du garde-fou ne doit jamais casser le formulaire — on laisse
    // passer, comme pour une règle absente. Log seul, sans alerte : le
    // garde-fou qui bronche n'empêche personne de publier.
    logError("rate_limit.check_failed", error, { bucket });
    return false;
  }
}
