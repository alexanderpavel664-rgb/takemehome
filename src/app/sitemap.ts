import type { MetadataRoute } from "next";
import { LISTED_WHERE } from "@/lib/animal-filters";
import { judetPath } from "@/lib/judete";
import { judetCombos } from "@/lib/judete-data";
import { prisma } from "@/lib/prisma";
import { SITE_URL } from "@/lib/site";

// Régénéré au plus une fois par heure : une page județ qui naît (premier
// animal d'un type dans un județ) ou une nouvelle annonce y entre dans
// l'heure, une annonce adoptée, masquée ou devenue injoignable en sort
// dans l'heure — et y revient dans l'heure quand le contact est complété.
export const revalidate = 3600;

/**
 * /sitemap.xml — les pages publiques stables, toutes les pages par județ
 * qui ont au moins un animal (les mêmes que generateStaticParams : jamais
 * une page vide), puis les fiches des animaux listés — le filtre des
 * listes publiques (LISTED_WHERE). Une fiche adoptée, inactive
 * (UNCONFIRMED), masquée ou sans contact n'y est pas : elle répond noindex
 * (voir proxy.ts et la fiche).
 * lastmod d'une fiche = son updatedAt ; d'une page județ, la dernière mise
 * à jour d'une de ses annonces.
 *
 * Hors sitemap : l'espace compte, la modération, l'authentification et
 * /favorite (noindex), /confirmare et /api (bloqués par robots.txt).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [combos, animals] = await Promise.all([
    judetCombos(),
    prisma.animal.findMany({
      where: LISTED_WHERE,
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      select: { id: true, updatedAt: true },
    }),
  ]);
  // Triées par updatedAt décroissant : la première est la plus récente.
  const latest = animals[0]?.updatedAt;
  return [
    { url: SITE_URL, lastModified: latest, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/animale`, lastModified: latest, changeFrequency: "daily", priority: 0.9 },
    ...combos.map((combo) => ({
      url: `${SITE_URL}${judetPath(combo.type, combo.county)}`,
      lastModified: combo.lastModified,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    ...animals.map((animal) => ({
      url: `${SITE_URL}/animal/${animal.id}`,
      lastModified: animal.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    { url: `${SITE_URL}/adoptati`, changeFrequency: "weekly", priority: 0.5 },
    { url: `${SITE_URL}/despre`, changeFrequency: "monthly", priority: 0.3 },
  ];
}
