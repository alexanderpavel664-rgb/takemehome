import { Suspense } from "react";
import type { Metadata } from "next";
import { PAGE_SIZE, parseCount } from "@/lib/animal-filters";
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
      <h1 className="mb-4 text-2xl font-bold">Și-au găsit o familie</h1>
      <Suspense fallback={<SkeletonGrid />}>
        <AnimalGrid
          where={{ status: "ADOPTED" }}
          count={count}
          moreHref={`/adoptati?n=${count + PAGE_SIZE}`}
          empty={
            <p className="my-10 text-center">
              Aucun animal adopté pour l&rsquo;instant.
            </p>
          }
        />
      </Suspense>
    </main>
  );
}
