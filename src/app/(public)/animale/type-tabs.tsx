import Link from "next/link";
import type { AnimalType } from "@/generated/prisma/client";
import { serializeFilters, type PublicFilters } from "@/lib/animal-filters";
import { STR } from "@/lib/strings";

const TABS: { tip: AnimalType | null; label: string }[] = [
  { tip: null, label: STR.animale.tabs.all },
  { tip: "DOG", label: STR.animale.tabs.DOG },
  { tip: "CAT", label: STR.animale.tabs.CAT },
  { tip: "OTHER", label: STR.animale.tabs.OTHER },
];

/**
 * Onglets de type, toujours visibles au-dessus de la grille. Changer
 * d'onglet conserve les autres filtres et repart à la première page
 * (pas de ?n dans l'URL générée). Navigation en encre sur crème : l'état
 * actif se marque au poids (600), pas à la couleur (DESIGN.md, Navigation) —
 * la seule hairline est celle qui court sous toute la barre.
 */
export function TypeTabs({ filters }: { filters: PublicFilters }) {
  return (
    <nav
      aria-label={STR.animale.tabsAriaLabel}
      className="flex border-b border-warm-border"
    >
      {TABS.map(({ tip, label }) => {
        const active = (filters.tip ?? null) === tip;
        const qs = serializeFilters(filters, { tip });
        return (
          <Link
            key={label}
            href={qs ? `/animale?${qs}` : "/animale"}
            aria-current={active ? "page" : undefined}
            // inline-flex : min-h-11 (cible tactile 44px) est sans effet
            // sur un élément inline. px-3 : les quatre onglets roumains
            // tiennent alors même sur un viewport de 320 px.
            className={
              "inline-flex min-h-11 items-center px-3 text-warm-ink " +
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-warm-ink" +
              (active ? " font-semibold" : "")
            }
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
