import type { ReactNode } from "react";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { AnimalCard } from "./animal-card";
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
    include: { photos: { orderBy: { position: "asc" }, take: 1 } },
  });
  const hasMore = animals.length > count;
  const shown = hasMore ? animals.slice(0, count) : animals;

  if (shown.length === 0) {
    return <>{empty}</>;
  }

  return (
    <>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {shown.map((animal, i) => (
          <li key={animal.id}>
            <AnimalCard animal={animal} eager={i < 4} />
          </li>
        ))}
      </ul>
      {hasMore && <LoadMore href={moreHref} />}
    </>
  );
}
