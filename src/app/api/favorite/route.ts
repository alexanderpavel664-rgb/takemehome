import { NextResponse } from "next/server";
import { CARD_SELECT, cardData } from "@/lib/animal-card-data";
import { isAnimalId, MAX_FAVORITES } from "@/lib/favorite-ids";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/favorite?ids=a,b,c — les cartes des favoris du navigateur
 * (localStorage, lib/favorites.ts), dans l'ordre demandé, et les ids qui
 * n'ont plus d'annonce publique : supprimée, ou masquée par la modération.
 * La page /favorite les retire alors des favoris et le dit.
 *
 * Aucune donnée personnelle : la liste d'ids vient du navigateur, ne laisse
 * aucune trace en base, et la réponse ne contient que ce que montrent déjà
 * les grilles publiques. Les annonces adoptées reviennent avec leur statut :
 * la page les range sous « Și-au găsit familia ».
 */
export async function GET(request: Request): Promise<NextResponse> {
  const raw = new URL(request.url).searchParams.get("ids") ?? "";
  const ids = [...new Set(raw.split(","))]
    .filter(isAnimalId)
    .slice(0, MAX_FAVORITES);
  if (ids.length === 0) {
    return NextResponse.json({ animals: [], missing: [] });
  }

  const found = await prisma.animal.findMany({
    // hidden: false comme partout ailleurs : une annonce masquée ne
    // reparaît pas par la petite porte des favoris.
    where: { id: { in: ids }, hidden: false },
    select: CARD_SELECT,
  });
  const byId = new Map(found.map((animal) => [animal.id, animal]));
  const now = new Date();

  return NextResponse.json(
    {
      animals: ids.flatMap((id) => {
        const animal = byId.get(id);
        return animal ? [cardData(animal, now)] : [];
      }),
      missing: ids.filter((id) => !byId.has(id)),
    },
    // Propre à ce navigateur : rien à garder en cache partagé.
    { headers: { "cache-control": "private, no-store" } },
  );
}
