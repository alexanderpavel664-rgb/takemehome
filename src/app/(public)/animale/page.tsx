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
import { AnimalGrid } from "../animal-grid";
import { SkeletonGrid } from "../skeleton-grid";
import { FilterAside, FilterSheet } from "./filter-sheet";
import { TypeTabs } from "./type-tabs";

export const metadata: Metadata = {
  title: "Animaux à adopter – TakeMeHome",
  description:
    "Chiens, chats et autres animaux à adopter en Roumanie, proposés par des refuges et des sauveteurs.",
};

// La colonne de filtres desktop (w-64 + gap-8) mange ~290px du max-w-5xl :
// en 4 colonnes les cartes tomberaient à ~166px, plus étroites que sur
// mobile — la grille de /animale plafonne donc à 3 colonnes en lg.
const GRID_CLASSES = "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-3";

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
      <h1 className="mb-4 text-2xl font-semibold text-warm-ink">
        Animaux à adopter
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
              squelettes ; « Vezi mai multe » garde la grille affichée. */}
          <div className="mt-4">
            <Suspense
              key={filterKey || "toate"}
              fallback={<SkeletonGrid gridClassName={GRID_CLASSES} />}
            >
              <AnimalGrid
                where={publicWhere(filters)}
                count={count}
                moreHref={moreHref}
                empty={hasAnyFilter ? <NoResults /> : <EmptyList />}
                gridClassName={GRID_CLASSES}
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
      title="Aucun animal pour l’instant"
      description="Revenez bientôt : de nouveaux animaux arrivent régulièrement."
    />
  );
}

function NoResults() {
  return (
    <EmptyState
      title="Aucun animal ne correspond à ces filtres"
      action={
        <ButtonLink variant="outline" href="/animale">
          Réinitialiser les filtres
        </ButtonLink>
      }
    />
  );
}
