import type { ReactNode } from "react";
import Link from "next/link";
import { STR } from "@/lib/strings";

/**
 * Le pied de page, sur TOUTES les coquilles — publique, compte, auth,
 * modération. Les deux liens juridiques ne sont pas décoratifs : le RGPD
 * (art. 12-13) demande une information « ușor accesibilă », et une page de
 * confidentialité qu'on ne peut atteindre que depuis l'accueil ne l'est pas.
 * C'est aussi pour ça qu'ils viennent EN DERNIER dans l'ordre de lecture
 * mais existent partout : discrets, jamais absents.
 *
 * `children` : les liens propres à une coquille (Animale adoptate, Despre
 * sur les pages publiques). Ils passent avant les liens juridiques.
 *
 * Le seul écran qui n'en a volontairement pas est /~offline : hors ligne,
 * tous ces liens échoueraient pareil, et proposer une sortie qui n'en est
 * pas une est pire que de n'en proposer aucune (La Règle de la Sortie).
 */

const linkClasses =
  "flex min-h-11 items-center text-warm-gray " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-warm-ink";

export function SiteFooter({ children }: { children?: ReactNode }) {
  return (
    // mt-auto : le body est une colonne flex min-h-full — le pied de page
    // reste en bas même quand le contenu est court.
    <footer className="mt-auto border-t border-warm-border">
      {/* Pleine largeur, mêmes gouttières que l'en-tête et les pages. */}
      <nav
        aria-label={STR.footer.ariaLabel}
        className="flex flex-wrap items-center gap-x-6 px-4 py-2 text-sm md:px-6 lg:px-8"
      >
        {children}
        <Link href="/confidentialitate" className={linkClasses}>
          {STR.footer.privacy}
        </Link>
        <Link href="/termeni" className={linkClasses}>
          {STR.footer.terms}
        </Link>
      </nav>
    </footer>
  );
}

/** Un lien du pied de page — pour que les coquilles n'aient pas à répéter les classes. */
export function FooterLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={linkClasses}>
      {children}
    </Link>
  );
}
