import type {
  AgeGroup,
  AnimalSize,
  AnimalType,
  Prisma,
  Sex,
} from "@/generated/prisma/client";
import {
  AGE_GROUP_LABELS,
  SEX_LABELS,
  SIZE_LABELS,
  TYPE_LABELS,
} from "@/lib/animal-labels";
import { COUNTY_CODES, type CountyCode } from "@/lib/counties";

export const PAGE_SIZE = 20;
// Garde-fou : borne la taille de liste demandée via l'URL (?n=).
const MAX_COUNT = 400;

/**
 * Filtres publics de /animale, tous portés par l'URL pour que Maria puisse
 * partager ou retrouver une recherche filtrée. Les valeurs sont les enums
 * Prisma telles quelles ; les booléens valent « 1 » quand ils sont actifs
 * (actif = « uniquement ceux qui ont ce trait », false en base signifiant
 * « non renseigné »).
 */
export type PublicFilters = {
  tip?: AnimalType;
  judet?: CountyCode;
  varsta?: AgeGroup;
  sex?: Sex;
  marime?: AnimalSize;
  sterilizat: boolean;
  vaccinat: boolean;
  cip: boolean;
  copii: boolean;
  caini: boolean;
  pisici: boolean;
};

export type PublicSearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function parseEnum<T extends string>(
  value: string | undefined,
  labels: Record<T, string>,
): T | undefined {
  // Object.hasOwn et non `in` : « constructor » ou « toString » passeraient
  // par la chaîne de prototypes et finiraient dans une requête Prisma.
  return value !== undefined && Object.hasOwn(labels, value)
    ? (value as T)
    : undefined;
}

export function parseFilters(sp: PublicSearchParams): PublicFilters {
  const judet = first(sp.judet);
  return {
    tip: parseEnum(first(sp.tip), TYPE_LABELS),
    judet:
      judet !== undefined &&
      (COUNTY_CODES as readonly string[]).includes(judet)
        ? (judet as CountyCode)
        : undefined,
    varsta: parseEnum(first(sp.varsta), AGE_GROUP_LABELS),
    sex: parseEnum(first(sp.sex), SEX_LABELS),
    marime: parseEnum(first(sp.marime), SIZE_LABELS),
    sterilizat: first(sp.sterilizat) === "1",
    vaccinat: first(sp.vaccinat) === "1",
    cip: first(sp.cip) === "1",
    copii: first(sp.copii) === "1",
    caini: first(sp.caini) === "1",
    pisici: first(sp.pisici) === "1",
  };
}

/** Nombre d'animaux affichés — pagination « Vezi mai multe » portée par ?n=. */
export function parseCount(sp: PublicSearchParams): number {
  const n = Number.parseInt(first(sp.n) ?? "", 10);
  if (Number.isNaN(n)) return PAGE_SIZE;
  return Math.min(Math.max(n, PAGE_SIZE), MAX_COUNT);
}

/** Filtres du bottom sheet actifs. Le type (onglets) ne compte pas. */
export function countActiveFilters(f: PublicFilters): number {
  return (
    [f.judet, f.varsta, f.sex, f.marime].filter((v) => v !== undefined).length +
    [f.sterilizat, f.vaccinat, f.cip, f.copii, f.caini, f.pisici].filter(
      Boolean,
    ).length
  );
}

/**
 * Query string canonique. `overrides.tip: null` retire l'onglet type ;
 * `overrides.n` est omis par défaut : tout changement de filtre repart
 * à la première page.
 */
export function serializeFilters(
  f: PublicFilters,
  overrides: { tip?: AnimalType | null; n?: number } = {},
): string {
  const params = new URLSearchParams();
  const tip = "tip" in overrides ? overrides.tip : f.tip;
  if (tip) params.set("tip", tip);
  if (f.judet) params.set("judet", f.judet);
  if (f.varsta) params.set("varsta", f.varsta);
  if (f.sex) params.set("sex", f.sex);
  if (f.marime) params.set("marime", f.marime);
  if (f.sterilizat) params.set("sterilizat", "1");
  if (f.vaccinat) params.set("vaccinat", "1");
  if (f.cip) params.set("cip", "1");
  if (f.copii) params.set("copii", "1");
  if (f.caini) params.set("caini", "1");
  if (f.pisici) params.set("pisici", "1");
  if (overrides.n !== undefined) params.set("n", String(overrides.n));
  return params.toString();
}

/** Clause where publique : uniquement les animaux disponibles + filtres. */
export function publicWhere(f: PublicFilters): Prisma.AnimalWhereInput {
  return {
    status: "AVAILABLE",
    ...(f.tip && { type: f.tip }),
    ...(f.judet && { county: f.judet }),
    ...(f.varsta && { ageGroup: f.varsta }),
    ...(f.sex && { sex: f.sex }),
    ...(f.marime && { size: f.marime }),
    ...(f.sterilizat && { sterilized: true }),
    ...(f.vaccinat && { vaccinated: true }),
    ...(f.cip && { microchipped: true }),
    ...(f.copii && { goodWithKids: true }),
    ...(f.caini && { goodWithDogs: true }),
    ...(f.pisici && { goodWithCats: true }),
  };
}
