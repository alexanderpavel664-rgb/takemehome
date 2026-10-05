import type { ReactNode } from "react";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { CARD_SELECT, cardData } from "@/lib/animal-card-data";
import { CardGrid } from "./card-grid";
import { LoadMore } from "./load-more";

/**
 * Grille publique partagée par /animale et /adoptati. Récupère count + 1
 * éléments pour savoir s'il reste des animaux sans count() séparé.
 */
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
    // Tri stable : updatedAt décroissant, id en départage des ex æquo — le
    // plus récemment mis à jour d'abord.
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    take: count + 1,
    select: CARD_SELECT,
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
      <CardGrid cards={shown.map((animal) => cardData(animal, now))} />
      {hasMore && <LoadMore href={moreHref} />}
    </>
  );
}
