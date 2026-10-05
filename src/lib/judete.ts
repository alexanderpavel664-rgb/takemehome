import type { AnimalType } from "@/generated/prisma/client";
import { COUNTIES, type CountyCode } from "@/lib/counties";

/**
 * Pages par județ (SEO) — /caini-de-adoptat/<slug> et /pisici-de-adoptie/<slug>.
 * Seuls les chiens et les chats ont leurs pages : ce sont les deux recherches
 * que les gens font (« câini de adoptat Cluj », « pisici de adopție Iași »).
 *
 * Module pur, sans base : la requête des combinaisons vit dans
 * judete-data.ts, réservé au serveur.
 */
export const SEO_TYPES = ["DOG", "CAT"] as const satisfies readonly AnimalType[];
export type SeoType = (typeof SEO_TYPES)[number];

export const SEO_BASE: Record<SeoType, string> = {
  DOG: "/caini-de-adoptat",
  CAT: "/pisici-de-adoptie",
};

/**
 * « Bistrița-Năsăud » → « bistrita-nasaud », « Satu Mare » → « satu-mare ».
 * NFD sépare chaque lettre de son diacritique (virgule souscrite U+0326,
 * brève, circonflexe), qu'on retire ; le reste devient des tirets.
 */
export function countySlug(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const BY_SLUG = new Map(COUNTIES.map((c) => [countySlug(c.name), c]));
const SLUG_BY_CODE = new Map(COUNTIES.map((c) => [c.code, countySlug(c.name)]));

export function countyFromSlug(slug: string) {
  return BY_SLUG.get(slug);
}

export function judetPath(type: SeoType, county: CountyCode): string {
  return `${SEO_BASE[type]}/${judetSlug(county)}`;
}

export function isSeoType(type: AnimalType): type is SeoType {
  return (SEO_TYPES as readonly AnimalType[]).includes(type);
}

export function judetSlug(county: CountyCode): string {
  return SLUG_BY_CODE.get(county) ?? county.toLowerCase();
}
