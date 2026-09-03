import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { STR } from "@/lib/strings";

export const metadata: Metadata = {
  title: STR.animal.notFoundMetaTitle,
};

/**
 * La cible du rewrite de proxy.ts quand une fiche n'existe pas (ou est
 * masquée pour un anonyme) : une page statique, sans loading.tsx au-dessus
 * d'elle, qui lance notFound() avant le moindre streaming — d'où un VRAI
 * statut 404, rendu par ../not-found.tsx (le même écran que la fiche
 * elle-même affiche quand c'est elle qui lance notFound() dans le flux).
 * L'URL affichée reste celle de la fiche : c'est un rewrite, pas une
 * redirection. Personne ne tape ce chemin à la main.
 */
export default function AnimalNegasitPage() {
  notFound();
}
