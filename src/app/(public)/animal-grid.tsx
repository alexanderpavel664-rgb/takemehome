import type { ReactNode } from "react";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import {
  animalDisplayName,
  animalMetaLine,
  deadlineLabel,
  groupLabel,
} from "@/lib/animal-display";
import { countyName } from "@/lib/counties";
import { AnimalCard } from "@/components/ui/animal-card";
import { LoadMore } from "./load-more";

/**
 * Grille publique partagée par /animale et /adoptati. Récupère count + 1
 * éléments pour savoir s'il reste des animaux sans count() séparé. Les
 * 4 premières photos (au-dessus de la ligne de flottaison) chargent en
 * eager, les autres en lazy (défaut de next/image).
 *
 * Mise en page : 2 colonnes sur mobile, puis auto-fill dès md — des cartes
 * d'au moins 260px quelle que soit la largeur disponible (avec ou sans
 * colonne de filtres), sans variante lg:/xl: à maintenir par page.
 */
export const GRID_CLASSES =
  "grid grid-cols-2 gap-3 md:grid-cols-[repeat(auto-fill,minmax(260px,1fr))] md:gap-4";

export async function AnimalGrid({
  where,
  count,
  moreHref,
  empty,
}: {
  where: Prisma.AnimalWhereInput;
  count: number;
  moreHref: string;
  empty: ReactNode;
}) {
  const animals = await prisma.animal.findMany({
    where,
    // Tri stable : updatedAt décroissant, id en départage des ex æquo.
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    take: count + 1,
    // La requête la plus chaude du site : uniquement ce que la carte
    // consomme — sans select, les 21 colonnes partiraient de Neon,
    // description comprise.
    select: {
      id: true,
      name: true,
      type: true,
      sex: true,
      ageGroup: true,
      ageText: true,
      county: true,
      status: true,
      // V2 : deux colonnes de plus, un entier et une date — le nom sans nom,
      // la pastille « 3 pui » et l'échéance. Toujours pas de description.
      count: true,
      availableUntil: true,
      photos: {
        orderBy: { position: "asc" },
        take: 1,
        select: { url: true },
      },
    },
  });
  const hasMore = animals.length > count;
  const shown = hasMore ? animals.slice(0, count) : animals;

  if (shown.length === 0) {
    return <>{empty}</>;
  }

  // Une seule lecture de l'horloge pour toute la grille.
  const now = new Date();

  return (
    <>
      <ul className={GRID_CLASSES}>
        {shown.map((animal, i) => (
          <li key={animal.id}>
            <AnimalCard
              href={`/animal/${animal.id}`}
              name={animalDisplayName(animal)}
              meta={animalMetaLine(animal)}
              county={countyName(animal.county)}
              photoUrl={animal.photos[0]?.url}
              // Sur /adoptati, chaque carte porte la pastille « Adoptat ».
              adopted={animal.status === "ADOPTED"}
              group={groupLabel(animal)}
              // Une fiche adoptée n'a plus d'échéance à montrer.
              deadline={
                animal.status === "ADOPTED"
                  ? null
                  : deadlineLabel(animal.availableUntil, "short", now)
              }
              eager={i < 4}
            />
          </li>
        ))}
      </ul>
      {hasMore && <LoadMore href={moreHref} />}
    </>
  );
}
