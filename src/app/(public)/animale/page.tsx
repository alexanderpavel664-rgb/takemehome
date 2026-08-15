import { Suspense } from "react";
import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  PAGE_SIZE,
  countActiveFilters,
  parseCount,
  parseFilters,
  publicWhere,
  serializeFilters,
} from "@/lib/animal-filters";
import { STR } from "@/lib/strings";
import { AnimalGrid } from "../animal-grid";
import { SkeletonGrid } from "../skeleton-grid";
import { FilterAside, FilterSheet } from "./filter-sheet";
import { TypeTabs } from "./type-tabs";

export const metadata: Metadata = {
  title: STR.animale.metaTitle,
  description: STR.animale.metaDescription,
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

  // Pleine largeur : la grille auto-fill absorbe l'espace, seules les
  // gouttières (px-4 md:px-6 lg:px-8) cadrent le contenu.
  return (
    <main className="px-4 py-4 md:px-6 lg:px-8">
      <h1 className="mb-4 text-2xl font-semibold text-warm-ink">
        {STR.animale.title}
      </h1>
      <div className="flex items-start lg:gap-8">
        {/* key = filtres : quand l'URL change (onglet, sheet mobile, reset),
            la colonne est remontée et son brouillon resynchronisé. */}
        <FilterAside key={filterKey} filters={filters} />
        <div className="min-w-0 flex-1">
          <TypeTabs filters={filters} />
          <div className="my-4 lg:hidden">
            <FilterSheet filters={filters} />
          </div>
          {/* key = filtres hors pagination : changer un filtre remonte les
              squelettes ; « Voir plus » garde la grille affichée. */}
          <div className="mt-4">
            <Suspense key={filterKey || "toate"} fallback={<SkeletonGrid />}>
              <AnimalGrid
                where={publicWhere(filters)}
                count={count}
                moreHref={moreHref}
                empty={hasAnyFilter ? <NoResults /> : <EmptyList />}
              />
            </Suspense>
          </div>
        </div>
      </div>
    </main>
  );
}

function EmptyList() {
  return (
    <EmptyState
      title={STR.animale.emptyTitle}
      description={STR.animale.emptyDescription}
    />
  );
}

function NoResults() {
  return (
    <EmptyState
      title={STR.animale.noResultsTitle}
      action={
        <ButtonLink variant="outline" href="/animale">
          {STR.animale.clearFilters}
        </ButtonLink>
      }
    />
  );
}
