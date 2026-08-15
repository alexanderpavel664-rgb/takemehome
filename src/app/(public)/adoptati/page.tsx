import { Suspense } from "react";
import type { Metadata } from "next";
import { PAGE_SIZE, parseCount } from "@/lib/animal-filters";
import { STR } from "@/lib/strings";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { AnimalGrid } from "../animal-grid";
import { SkeletonGrid } from "../skeleton-grid";

export const metadata: Metadata = {
  title: STR.adoptati.metaTitle,
  description: STR.adoptati.metaDescription,
};

// Même grille que /animale, sans filtres ni contact — la fiche masque
// elle-même les boutons de contact des animaux adoptés.
export default async function AdoptatiPage(props: PageProps<"/adoptati">) {
  const sp = await props.searchParams;
  const count = parseCount(sp);

  return (
    // Pleine largeur : la grille auto-fill absorbe l'espace, seules les
    // gouttières (px-4 md:px-6 lg:px-8) cadrent le contenu ; l'EmptyState
    // centre lui-même son texte.
    <main className="px-4 py-4 md:px-6 lg:px-8">
      <h1 className="mb-4 text-2xl font-semibold text-warm-ink">
        {STR.adoptati.title}
      </h1>
      <Suspense fallback={<SkeletonGrid />}>
        <AnimalGrid
          // hidden: false comme partout ailleurs — une annonce masquée ne
          // reparaît pas par la petite porte des animaux adoptés.
          where={{ status: "ADOPTED", hidden: false }}
          count={count}
          moreHref={`/adoptati?n=${count + PAGE_SIZE}`}
          empty={
            <EmptyState
              title={STR.adoptati.emptyTitle}
              description={STR.adoptati.emptyDescription}
              action={
                <ButtonLink variant="outline" href="/animale">
                  {STR.animal.seeAvailable}
                </ButtonLink>
              }
            />
          }
        />
      </Suspense>
    </main>
  );
}
