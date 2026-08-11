import Link from "next/link";
import type { AnimalType } from "@/generated/prisma/client";
import { serializeFilters, type PublicFilters } from "@/lib/animal-filters";

const TABS: { tip: AnimalType | null; label: string }[] = [
  { tip: null, label: "Toate" },
  { tip: "DOG", label: "Câini" },
  { tip: "CAT", label: "Pisici" },
  { tip: "OTHER", label: "Altele" },
];

/**
 * Onglets de type, toujours visibles au-dessus de la grille. Changer
 * d'onglet conserve les filtres du bottom sheet et repart à la première
 * page (pas de ?n dans l'URL générée).
 */
export function TypeTabs({ filters }: { filters: PublicFilters }) {
  return (
    <nav aria-label="Type d'animal" className="flex border-b">
      {TABS.map(({ tip, label }) => {
        const active = (filters.tip ?? null) === tip;
        const qs = serializeFilters(filters, { tip });
        return (
          <Link
            key={label}
            href={qs ? `/animale?${qs}` : "/animale"}
            aria-current={active ? "page" : undefined}
            // inline-flex : min-h-11 (cible tactile 44px) est sans effet
            // sur un élément inline.
            className={
              active
                ? "-mb-px inline-flex min-h-11 items-center border-b-4 border-current px-4 font-bold"
                : "inline-flex min-h-11 items-center px-4 text-gray-600"
            }
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
