import type { ReactNode } from "react";
import { SiteHeader } from "@/components/site-header";

/**
 * Coquille de l'espace compte : le même en-tête que partout, logo seul —
 * c'est le chemin d'une publiante vers le site public, pour voir son
 * annonce comme la voit un adoptant. Pas d'accès compte à droite : on y est.
 */
export default function ContLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteHeader />
      {children}
    </>
  );
}
