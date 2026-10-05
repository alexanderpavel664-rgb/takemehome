import Link from "next/link";
import { countyName } from "@/lib/counties";
import { judetPath, SEO_TYPES } from "@/lib/judete";
import type { JudetCombo } from "@/lib/judete-data";
import { STR } from "@/lib/strings";

/**
 * Les pages par județ, liées depuis les grilles : sans lien qui y mène, une
 * page n'existe guère pour un moteur de recherche (le sitemap aide, il ne
 * suffit pas). Sous la grille, derrière une hairline, en encre sur crème :
 * la grille reste le sujet, ceci est une porte.
 *
 * prefetch={false} : quatre-vingts liens en bas de page ne doivent pas
 * déclencher quatre-vingts préchargements en 4G.
 */
export function JudetLinks({
  combos,
  current,
}: {
  combos: JudetCombo[];
  /** Chemin de la page courante : marqué au poids, comme les onglets. */
  current?: string;
}) {
  if (combos.length === 0) {
    return null;
  }
  return (
    <nav
      aria-label={STR.judet.navLabel}
      className="mt-10 border-t border-warm-border pt-6"
    >
      {SEO_TYPES.map((type) => {
        const list = combos.filter((combo) => combo.type === type);
        if (list.length === 0) {
          return null;
        }
        return (
          <section key={type} className="mb-6">
            <h2 className="text-lg font-semibold text-warm-ink">
              {STR.judet.linksTitle[type]}
            </h2>
            <ul className="mt-1 flex flex-wrap gap-x-4 text-sm">
              {list.map((combo) => {
                const href = judetPath(type, combo.county);
                const active = href === current;
                return (
                  <li key={combo.county}>
                    <Link
                      href={href}
                      prefetch={false}
                      aria-current={active ? "page" : undefined}
                      className={
                        "inline-flex min-h-11 items-center text-warm-ink underline-offset-4 hover:underline " +
                        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-warm-ink" +
                        (active ? " font-semibold" : "")
                      }
                    >
                      {STR.judet.link(countyName(combo.county), combo.animals)}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </nav>
  );
}
