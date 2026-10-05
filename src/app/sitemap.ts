import type { MetadataRoute } from "next";
import { judetPath } from "@/lib/judete";
import { judetCombos } from "@/lib/judete-data";
import { SITE_URL } from "@/lib/site";

// Régénéré au plus une fois par heure : une page județ qui naît (premier
// animal d'un type dans un județ) y entre dans l'heure.
export const revalidate = 3600;

/**
 * /sitemap.xml — les pages publiques stables, puis toutes les pages par
 * județ qui ont au moins un animal (les mêmes que generateStaticParams :
 * jamais une page vide). lastmod d'une page județ = la dernière mise à jour
 * d'une de ses annonces. Les fiches /animal/[id] n'y sont pas : elles vont
 * et viennent, et les pages județ y mènent.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const combos = await judetCombos();
  const latest = combos.reduce<Date | undefined>(
    (max, combo) => (!max || combo.lastModified > max ? combo.lastModified : max),
    undefined,
  );
  return [
    { url: SITE_URL, lastModified: latest, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/animale`, lastModified: latest, changeFrequency: "daily", priority: 0.9 },
    ...combos.map((combo) => ({
      url: `${SITE_URL}${judetPath(combo.type, combo.county)}`,
      lastModified: combo.lastModified,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    { url: `${SITE_URL}/adoptati`, changeFrequency: "weekly", priority: 0.5 },
    { url: `${SITE_URL}/despre`, changeFrequency: "monthly", priority: 0.3 },
  ];
}
