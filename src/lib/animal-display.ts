import type { AgeGroup, AnimalType, Sex } from "@/generated/prisma/client";
import {
  AGE_GROUP_LABELS,
  SEX_LABELS,
  TYPE_LABELS,
} from "@/lib/animal-labels";
import { countRo, STR } from "@/lib/strings";

/**
 * « Chien · Mâle · 3 ans » — la ligne des cartes et de la fiche.
 * Les champs non renseignés sont omis ; l'âge libre (ageText) prime sur
 * la tranche d'âge.
 */
export function animalMetaLine(animal: {
  type: AnimalType;
  sex: Sex | null;
  ageGroup: AgeGroup | null;
  ageText: string | null;
}): string {
  const age =
    animal.ageText?.trim() ||
    (animal.ageGroup ? AGE_GROUP_LABELS[animal.ageGroup] : null);
  return [
    TYPE_LABELS[animal.type],
    animal.sex ? SEX_LABELS[animal.sex] : null,
    age,
  ]
    .filter(Boolean)
    .join(" · ");
}

/** Ce qu'il faut lire pour nommer une annonce : le nom, le type, le nombre. */
export type AnimalIdentity = {
  name: string | null;
  type: AnimalType;
  count: number;
};

/**
 * Le nom de l'animal, ou le mot qui en tient lieu — « Cățel », « Pisică »,
 * au pluriel pour une fratrie sans nom. Affiché partout où le nom l'est :
 * Display de la fiche, carte, aplat de repli sans photo, titres. NULL en
 * base vaut « pas de nom » ; une chaîne vide ou blanche est traitée pareil,
 * par prudence, mais l'action n'en écrit jamais.
 */
export function animalDisplayName(animal: AnimalIdentity): string {
  const name = animal.name?.trim();
  if (name) {
    return name;
  }
  return animal.count > 1
    ? STR.animal.unnamedPlural[animal.type]
    : STR.animal.unnamed[animal.type];
}

/**
 * « 3 pui », « 2 câini », « 20 de pisici » — la pastille des fratries ;
 * null pour un animal seul. « pui » dès que l'annonce dit Pui, sinon le
 * mot du type : trois chiens adultes trouvés ensemble ne sont pas des pui.
 */
export function groupLabel(animal: {
  count: number;
  type: AnimalType;
  ageGroup: AgeGroup | null;
}): string | null {
  if (animal.count <= 1) {
    return null;
  }
  const [one, many] =
    animal.ageGroup === "BABY"
      ? STR.animal.groupBaby
      : STR.animal.groupByType[animal.type];
  return countRo(animal.count, one, many);
}

/**
 * Le sujet d'une phrase — « Fulga caută o familie », « 3 pui caută o
 * familie », « Un cățel caută o familie ». Pour le texte de partage et
 * la description Open Graph : avec l'article quand il n'y a pas de nom,
 * sinon la phrase sonne comme un titre.
 */
export function animalSubject(
  animal: AnimalIdentity & { ageGroup: AgeGroup | null },
): string {
  const name = animal.name?.trim();
  if (name) {
    return name;
  }
  return groupLabel(animal) ?? STR.animal.unnamedSubject[animal.type];
}

/** « Fulga caută o familie » — le `text` du partage natif. */
export function shareText(
  animal: AnimalIdentity & { ageGroup: AgeGroup | null },
): string {
  return STR.animal.shareText(animalSubject(animal));
}

/* ——— Échéance. ——— */

/**
 * Le badge « Până la … » n'apparaît que dans les derniers jours avant
 * l'échéance : deux semaines. Assez pour qu'un partage produise une
 * adoption (visite, transport, décision), assez court pour que le badge
 * reste rare — un refuge qui pose une date à deux mois ne l'affiche pas
 * pendant deux mois. Le jour même compte ; le lendemain, plus rien.
 */
export const URGENCY_WINDOW_DAYS = 14;

const DAY_MS = 86_400_000;

// Le jour civil en Roumanie, à minuit UTC — la forme qu'a aussi une
// colonne DATE lue par Prisma. Le serveur tourne en UTC : à 23 h à
// București, « aujourd'hui » y est encore le jour d'avant.
function todayInRomania(now: Date): number {
  const [y, m, d] = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Bucharest",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(now)
    .split("-")
    .map(Number);
  return Date.UTC(y, m - 1, d);
}

/**
 * « Până la 15 sept. » (carte) ou « Până la 15 septembrie » (fiche) quand
 * l'échéance est dans la fenêtre ; null sans échéance, avant la fenêtre, et
 * dès que la date est passée — le badge s'efface seul, l'annonce reste.
 * `availableUntil` est un jour à minuit UTC (colonne DATE).
 */
export function deadlineLabel(
  availableUntil: Date | null,
  format: "short" | "long" = "short",
  now: Date = new Date(),
): string | null {
  if (!availableUntil) {
    return null;
  }
  const daysLeft = Math.round(
    (availableUntil.getTime() - todayInRomania(now)) / DAY_MS,
  );
  if (daysLeft < 0 || daysLeft > URGENCY_WINDOW_DAYS) {
    return null;
  }
  const date = new Intl.DateTimeFormat("ro", {
    day: "numeric",
    month: format === "long" ? "long" : "short",
    timeZone: "UTC",
  }).format(availableUntil);
  return STR.animal.until(date);
}

/** La valeur d'un <input type="date"> pour une colonne DATE : « 2026-09-15 ». */
export function dateInputValue(date: Date | null): string {
  return date ? date.toISOString().slice(0, 10) : "";
}
