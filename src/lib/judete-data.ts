import { COUNTY_CODES, countyName, type CountyCode } from "@/lib/counties";
import { isSeoType, SEO_TYPES, type SeoType } from "@/lib/judete";
import { prisma } from "@/lib/prisma";

export type JudetCombo = {
  type: SeoType;
  county: CountyCode;
  /** Animaux, pas annonces : une fratrie de 5 compte pour 5 (somme de count). */
  animals: number;
  /** Dernière mise à jour d'une annonce de la combinaison — lastmod du sitemap. */
  lastModified: Date;
};

/**
 * Les combinaisons type × județ qui ont au moins un animal disponible et
 * visible — exactement celles qui méritent une page : une page vide nuit au
 * référencement. Une seule requête groupée, servie par les index existants.
 * Triées par nom de județ (ordre roumain), chiens puis chats.
 */
export async function judetCombos(): Promise<JudetCombo[]> {
  const rows = await prisma.animal.groupBy({
    by: ["type", "county"],
    where: {
      status: "AVAILABLE",
      hidden: false,
      type: { in: [...SEO_TYPES] },
    },
    _sum: { count: true },
    _max: { updatedAt: true },
  });
  const collator = new Intl.Collator("ro");
  return rows
    .filter(
      (row): row is typeof row & { type: SeoType; county: CountyCode } =>
        isSeoType(row.type) &&
        (COUNTY_CODES as readonly string[]).includes(row.county),
    )
    .map((row) => ({
      type: row.type,
      county: row.county,
      animals: row._sum.count ?? 0,
      lastModified: row._max.updatedAt ?? new Date(0),
    }))
    .filter((combo) => combo.animals > 0)
    .sort(
      (a, b) =>
        SEO_TYPES.indexOf(a.type) - SEO_TYPES.indexOf(b.type) ||
        collator.compare(countyName(a.county), countyName(b.county)),
    );
}
