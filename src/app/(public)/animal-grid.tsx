import type { ReactNode } from "react";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { animalMetaLine } from "@/lib/animal-display";
import { countyName } from "@/lib/counties";
import { AnimalCard } from "@/components/ui/animal-card";
import { LoadMore } from "./load-more";

/**
 * Grille publique partagée par /animale et /adoptati. Récupère count + 1
 * éléments pour savoir s'il reste des animaux sans count() séparé. Les
 * 4 premières photos (au-dessus de la ligne de flottaison) chargent en
 * eager, les autres en lazy (défaut de next/image).
 */
export async function AnimalGrid({
  where,
  count,
  moreHref,
  empty,
  gridClassName = "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4",
}: {
  where: Prisma.AnimalWhereInput;
  count: number;
  moreHref: string;
  empty: ReactNode;
  /** /animale plafonne à lg:grid-cols-3 : sa colonne de filtres mange ~290px en lg. */
  gridClassName?: string;
}) {
  const animals = await prisma.animal.findMany({
    where,
    // Tri stable : updatedAt décroissant, id en départage des ex æquo.
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    take: count + 1,
    include: { photos: { orderBy: { position: "asc" }, take: 1 } },
  });
  const hasMore = animals.length > count;
  const shown = hasMore ? animals.slice(0, count) : animals;

  if (shown.length === 0) {
    return <>{empty}</>;
  }

  return (
    <>
      <ul className={gridClassName}>
        {shown.map((animal, i) => (
          <li key={animal.id}>
            <AnimalCard
              href={`/animal/${animal.id}`}
              name={animal.name}
              meta={animalMetaLine(animal)}
              county={countyName(animal.county)}
              photoUrl={animal.photos[0]?.url}
              // Sur /adoptati, chaque carte porte la pastille « Adoptat ».
              adopted={animal.status === "ADOPTED"}
              eager={i < 4}
            />
          </li>
        ))}
      </ul>
      {hasMore && <LoadMore href={moreHref} />}
    </>
  );
}
