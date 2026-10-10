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
  /**
   * Inactive faute de confirmation, ou disponible mais sans contact
   * affiché : n'apparaît que sur /favorite, les listes publiques excluent
   * les deux.
   */
  inactive: boolean;
  group: string | null;
  deadline: string | null;
};

/**
 * `now` : une seule lecture de l'horloge pour toute une grille.
 * `contactable` : le contact du publiant (lib/contact-status.ts). Vrai par
 * défaut, parce que les listes publiques ne contiennent que des annonces
 * joignables (LISTED_WHERE) ; seule l'API des favoris le lit et le passe.
 */
export function cardData(
  animal: CardAnimal,
  now: Date,
  contactable = true,
): CardData {
  const adopted = animal.status === "ADOPTED";
  // Sans contact, une annonce disponible se range avec les inactives :
  // même pastille, même place, hors du compteur de l'en-tête. Une adoptée
  // reste adoptée — elle n'affiche plus de contact de toute façon.
  const inactive =
    animal.status === "UNCONFIRMED" ||
    (animal.status === "AVAILABLE" && !contactable);
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
