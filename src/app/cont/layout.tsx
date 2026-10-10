import type { ReactNode } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/viewer";
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
 *
 * C'est aussi la porte des conditions : un compte dont l'acceptation n'est
 * pas enregistrée (créé avant la règle, ou avec Google depuis /login) est
 * renvoyé vers /accepta-termenii avant toute page de l'espace. Le layout
 * est rendu à chaque entrée dans /cont — et la session est lue par le
 * getSession mis en cache, que la page réutilise : aucune requête de plus.
 * L'absence de session reste l'affaire de chaque page (redirect /login).
 */

// Toutes les pages de l'espace en héritent (fusion des métadonnées). Pas
// bloqué dans robots.txt : Google doit pouvoir lire ce noindex.
export const metadata: Metadata = {
  robots: { index: false },
};

export default async function ContLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (session && !session.user.termsAcceptedAt) {
    redirect("/accepta-termenii");
  }

  return (
    <>
      <SiteHeader />
      {children}
      <SiteFooter />
    </>
  );
}
