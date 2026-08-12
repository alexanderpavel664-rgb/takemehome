import { Suspense } from "react";
import type { Metadata } from "next";
import { PAGE_SIZE, parseCount } from "@/lib/animal-filters";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { AnimalGrid } from "../animal-grid";
import { SkeletonGrid } from "../skeleton-grid";

export const metadata: Metadata = {
  title: "Și-au găsit o familie – TakeMeHome",
  description: "Les animaux adoptés grâce aux refuges présents sur TakeMeHome.",
};

// Même grille que /animale, sans filtres ni contact — la fiche masque
// elle-même les boutons de contact des animaux adoptés.
export default async function AdoptatiPage(props: PageProps<"/adoptati">) {
  const sp = await props.searchParams;
  const count = parseCount(sp);

  return (
    <main className="mx-auto max-w-5xl p-4">
      <h1 className="mb-4 text-2xl font-semibold text-warm-ink">
        Și-au găsit o familie
      </h1>
      <Suspense fallback={<SkeletonGrid />}>
        <AnimalGrid
          where={{ status: "ADOPTED" }}
          count={count}
          moreHref={`/adoptati?n=${count + PAGE_SIZE}`}
          empty={
            <EmptyState
              title="Aucun animal adopté pour l'instant"
              description="Dès qu'un animal aura trouvé sa famille, il apparaîtra ici."
              action={
                <ButtonLink variant="outline" href="/animale">
                  Voir les animaux à adopter
                </ButtonLink>
              }
            />
          }
        />
      </Suspense>
    </main>
  );
}
