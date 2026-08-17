import type { ReactNode } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

/**
 * Coquille de l'espace compte : le même en-tête que partout, logo seul —
 * c'est le chemin d'une publiante vers le site public, pour voir son
 * annonce comme la voit un adoptant. Pas d'accès compte à droite : on y est.
 *
 * Le pied de page juridique est ici aussi, sans les liens publics : c'est
 * précisément dans son compte qu'une publiante a le plus de raisons d'aller
 * lire ce qu'on fait de ses données.
 */
export default function ContLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteHeader />
      {children}
      <SiteFooter />
    </>
  );
}
