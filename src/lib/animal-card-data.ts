import type { Prisma } from "@/generated/prisma/client";
import {
  animalDisplayName,
  animalMetaLine,
  deadlineLabel,
  groupLabel,
} from "@/lib/animal-display";
import { countyName } from "@/lib/counties";
import { relativeTimeRo } from "@/lib/relative-time";

/**
 * Ce qu'une carte de grille consomme, et rien d'autre : la requête la plus
 * chaude du site (grille /animale, accueil, pages județ, favoris). Sans
 * select, les 25 colonnes partiraient de Neon, description comprise.
 * Des photos, seule la principale (position 0).
 */
export const CARD_SELECT = {
  id: true,
  name: true,
  type: true,
  sex: true,
  ageGroup: true,
  ageText: true,
  county: true,
  status: true,
  count: true,
  availableUntil: true,
  // V3 : l'âge de l'annonce sur la carte (« acum 3 zile »).
  updatedAt: true,
  photos: {
    orderBy: { position: "asc" },
    take: 1,
    select: { url: true },
  },
} satisfies Prisma.AnimalSelect;

export type CardAnimal = Prisma.AnimalGetPayload<{ select: typeof CARD_SELECT }>;

/** Les props d'AnimalCard — sérialisables, pour l'API des favoris aussi. */
export type CardData = {
  href: string;
  id: string;
  name: string;
  meta: string;
  county: string;
  updated: { label: string; iso: string };
  photoUrl: string | null;
  adopted: boolean;
  /** Inactive faute de confirmation : n'apparaît que sur /favorite. */
  inactive: boolean;
  group: string | null;
  deadline: string | null;
};

/** `now` : une seule lecture de l'horloge pour toute une grille. */
export function cardData(animal: CardAnimal, now: Date): CardData {
  const adopted = animal.status === "ADOPTED";
  const inactive = animal.status === "UNCONFIRMED";
  return {
    href: `/animal/${animal.id}`,
    id: animal.id,
    name: animalDisplayName(animal),
    meta: animalMetaLine(animal),
    county: countyName(animal.county),
    updated: {
      label: relativeTimeRo(animal.updatedAt, now),
      iso: animal.updatedAt.toISOString(),
    },
    photoUrl: animal.photos[0]?.url ?? null,
    adopted,
    inactive,
    group: groupLabel(animal),
    // Une fiche adoptée ou inactive n'a plus d'échéance à montrer.
    deadline:
      adopted || inactive ? null : deadlineLabel(animal.availableUntil, "short", now),
  };
}
