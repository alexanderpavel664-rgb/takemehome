import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  PAGE_SIZE,
  countActiveFilters,
  parseCount,
  parseFilters,
  publicWhere,
  serializeFilters,
} from "@/lib/animal-filters";
import { AnimalGrid } from "../animal-grid";
import { SkeletonGrid } from "../skeleton-grid";
import { FilterSheet } from "./filter-sheet";
import { TypeTabs } from "./type-tabs";

export const metadata: Metadata = {
  title: "Animaux à adopter – TakeMeHome",
  description:
    "Chiens, chats et autres animaux à adopter en Roumanie, proposés par des refuges et des sauveteurs.",
};

// La page lit searchParams (filtres + pagination) : rendu dynamique à
// chaque requête, HTML complet côté serveur, indexable.
export default async function AnimalePage(props: PageProps<"/animale">) {
  const sp = await props.searchParams;
  const filters = parseFilters(sp);
  const count = parseCount(sp);
  const filterKey = serializeFilters(filters);
  const hasAnyFilter = countActiveFilters(filters) > 0 || Boolean(filters.tip);
  const moreHref = `/animale?${serializeFilters(filters, {
    n: count + PAGE_SIZE,
  })}`;

  return (
    <main className="mx-auto max-w-5xl p-4">
      <h1 className="mb-4 text-2xl font-bold">Animaux à adopter</h1>
      <TypeTabs filters={filters} />
      <div className="my-4">
        <FilterSheet filters={filters} />
      </div>
      {/* key = filtres hors pagination : changer un filtre remonte les
          squelettes ; « Vezi mai multe » garde la grille affichée. */}
      <Suspense key={filterKey || "toate"} fallback={<SkeletonGrid />}>
        <AnimalGrid
          where={publicWhere(filters)}
          count={count}
          moreHref={moreHref}
          empty={hasAnyFilter ? <NoResults /> : <EmptyList />}
        />
      </Suspense>
    </main>
  );
}

function EmptyList() {
  return (
    <p className="my-10 text-center">
      Aucun animal pour l&rsquo;instant. Revenez bientôt !
    </p>
  );
}

function NoResults() {
  return (
    <div className="my-10 text-center">
      <p>Aucun animal ne correspond à ces filtres.</p>
      <p className="mt-3">
        <Link href="/animale" className="inline-block min-h-11 underline">
          Réinitialiser les filtres
        </Link>
      </p>
    </div>
  );
}
