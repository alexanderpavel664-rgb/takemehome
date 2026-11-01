import { getSessionCookie } from "better-auth/cookies";
import { headers } from "next/headers";
import { after } from "next/server";
import { bucharestDay } from "@/lib/confirmations";
import { logError } from "@/lib/log";
import { prisma } from "@/lib/prisma";
import { isRateLimited } from "@/lib/rate-limit";
import { getViewer } from "@/lib/viewer";

/**
 * Combien de fois une annonce a été ouverte, pour la personne qui l'a publiée
 * (/cont). Des totaux par annonce et par jour, rien d'autre : ni cookie, ni
 * identifiant, ni adresse IP en base. Aucun code ne s'exécute dans le
 * navigateur : le serveur compte la page qu'on lui demande. C'est ce qui tient
 * le compteur hors de l'article 5(3) de la directive ePrivacy, que l'EDPB
 * applique au JavaScript qui fait envoyer une requête (lignes directrices
 * 2/2023, point 2.5). Voir lib/legal.ts, politique, points 2, 4 et 5.
 *
 * Compté depuis le rendu de la fiche, et non dans proxy.ts : la fiche n'est
 * jamais servie depuis un cache (force-dynamic), elle n'est pas rendue par un
 * préchargement (loading.tsx arrête le préchargement avant la page), et
 * elle couvre les navigations internes, que le proxy laisse passer.
 *
 * Les chiffres sont approximatifs, et /cont le dit. Sans identifiant, on ne
 * dédoublonne pas : recharger la page compte encore une vue. Ce qui borne
 * l'inflation : le filtre ci-dessous, la limite par IP du WAF, le plafond par
 * jour et par annonce. Et rien à y gagner : le chiffre n'est ni public, ni
 * utilisé pour trier les annonces.
 */

/** Plafond par annonce et par jour. */
export const DAILY_VIEW_CAP = 300;

// Aperçus de liens, moteurs, outils et clients HTTP. Les navigateurs intégrés
// à Facebook (FBAN/FBAV), à WhatsApp et à Telegram sont de vraies personnes :
// seuls leurs robots d'aperçu sont visés.
const NON_HUMAN_UA =
  /bot\b|bot\/|crawl|spider|slurp|facebookexternalhit|facebookcatalog|meta-external|whatsapp\/|lighthouse|pagespeed|headless|preview|curl|wget|python|httpclient|axios|node-fetch|go-http|okhttp|java\//i;

/**
 * Une vraie page, demandée par un vrai navigateur ? `sec-fetch-dest` est posé
 * par le navigateur lui-même, et les scripts ordinaires ne l'envoient pas :
 * « document » pour un chargement, « empty » et « same-origin » pour une
 * navigation interne. Next retire ses propres en-têtes de headers() (`rsc`,
 * `next-router-prefetch`, `next-url` : vérifié) : c'est loading.tsx qui écarte
 * les préchargements du routeur (la page n'est pas rendue), `sec-purpose` ceux
 * du navigateur. Un fetch de service worker se confondrait avec une navigation
 * interne : d'où cacheOnNavigation coupé dans app/layout.tsx.
 */
export function isHumanPageLoad(requestHeaders: Headers): boolean {
  const userAgent = requestHeaders.get("user-agent");
  const destination = requestHeaders.get("sec-fetch-dest");
  return Boolean(
    userAgent &&
      !NON_HUMAN_UA.test(userAgent) &&
      (destination === "document" ||
        (destination === "empty" &&
          requestHeaders.get("sec-fetch-site") === "same-origin")) &&
      !requestHeaders.get("sec-purpose")?.includes("prefetch"),
  );
}

/**
 * À appeler pendant le rendu de la fiche. La lecture des en-têtes et de la
 * session doit se faire ici : after() ne peut plus y accéder depuis un
 * Server Component. Sans cookie de session, aucune requête de plus avant la
 * réponse : ni la publiante connectée, ni la modération ne comptent.
 */
export async function countAnimalView(animal: {
  id: string;
  userId: string;
}): Promise<void> {
  // Les préproductions utilisent la base de production : une visite de test
  // n'y écrit jamais rien.
  if (process.env.VERCEL_ENV === "preview") {
    return;
  }
  const requestHeaders = new Headers(await headers());
  if (!isHumanPageLoad(requestHeaders)) {
    return;
  }
  if (getSessionCookie(requestHeaders)) {
    const viewer = await getViewer();
    if (viewer?.id === animal.userId || viewer?.role === "ADMIN") {
      return;
    }
  }
  after(async () => {
    try {
      if (await isRateLimited("view", requestHeaders)) {
        return;
      }
      await prisma.$executeRaw`
        INSERT INTO "AnimalStat" ("animalId", "day", "views")
        VALUES (${animal.id}, ${bucharestDay(new Date())}::date, 1)
        ON CONFLICT ("animalId", "day") DO UPDATE
        SET "views" = LEAST("AnimalStat"."views" + 1, ${DAILY_VIEW_CAP}::int)`;
    } catch (error) {
      // Une vue perdue ne mérite ni alerte ni erreur : la page est déjà
      // partie, et le chiffre est approximatif de toute façon.
      logError("animal_stat.write_failed", error);
    }
  });
}

/** Vues de chaque annonce d'un compte : au total, et sur les 7 derniers jours. */
export async function viewsByAnimal(
  userId: string,
  now: Date,
): Promise<Map<string, { total: number; lastWeek: number }>> {
  // Un chiffre d'appoint ne fait jamais tomber /cont : en cas d'échec, la page
  // s'affiche sans vues.
  const rows = await prisma.animalStat
    .findMany({
      where: { animal: { userId } },
      select: { animalId: true, day: true, views: true },
    })
    .catch((error: unknown) => {
      logError("animal_stat.read_failed", error);
      return [];
    });
  // day est à minuit UTC (@db.Date) : le comparer au jour civil roumain.
  const weekStart = new Date(`${bucharestDay(now)}T00:00:00Z`);
  weekStart.setUTCDate(weekStart.getUTCDate() - 6);
  const views = new Map<string, { total: number; lastWeek: number }>();
  for (const row of rows) {
    const entry = views.get(row.animalId) ?? { total: 0, lastWeek: 0 };
    entry.total += row.views;
    if (row.day >= weekStart) {
      entry.lastWeek += row.views;
    }
    views.set(row.animalId, entry);
  }
  return views;
}
