import type { ReactNode } from "react";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { STR } from "@/lib/strings";

/**
 * En-tête commun à toutes les coquilles (publique, compte, auth) : le logo
 * en haut à gauche, cliquable, partout identique — une navigation qui change
 * de structure entre les pages érode la confiance.
 *
 * Le logo mène à la page d'accueil /. Le lien porte aria-label="Acasă" : un lecteur
 * d'écran doit annoncer la destination, pas la marque (le SVG du logo garde
 * son propre libellé, mais c'est l'aria-label du lien qui fait le nom).
 *
 * `children` : l'emplacement de droite (l'accès au compte sur les pages
 * publiques) — volontairement discret, jamais un bouton plein.
 */
export function SiteHeader({ children }: { children?: ReactNode }) {
  return (
    <header className="border-b border-warm-border">
      {/* Pleine largeur, mêmes gouttières que les pages : le logo et les
          liens s'alignent avec le contenu à toutes les largeurs. */}
      <div className="flex items-center justify-between gap-4 px-4 py-2 md:px-6 lg:px-8">
        <Link
          href="/"
          aria-label={STR.header.homeAriaLabel}
          className="flex min-h-11 items-center rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-warm-ink"
        >
          <Logo variant="lockup" />
        </Link>
        {children}
      </div>
    </header>
  );
}
