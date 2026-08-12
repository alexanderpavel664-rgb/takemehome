import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "À propos – TakeMeHome",
  description:
    "TakeMeHome rassemble les annonces d'adoption d'animaux sauvés en Roumanie : des fiches claires, des filtres utiles et un contact direct avec la personne qui a l'animal en garde.",
};

/**
 * Page « À propos » minimale : elle existe d'abord pour que le pied de page
 * ne mène nulle part vers une impasse. Contenu strictement factuel, repris
 * de PRODUCT.md — ni témoignage, ni chiffre, ni promesse (rien à fabriquer).
 */
export default function DesprePage() {
  return (
    <main className="mx-auto max-w-3xl p-4 md:px-6 lg:px-8">
      <h1 className="mb-4 text-2xl font-semibold text-warm-ink">À propos</h1>
      {/* Mesure typographique : 45–75 caractères par ligne (WCAG 1.4.8). */}
      <div className="max-w-[66ch] space-y-4 text-base text-warm-ink">
        <p>
          TakeMeHome rassemble des annonces d&rsquo;adoption pour des animaux
          sauvés en Roumanie. À la place de publications éparpillées sur les
          réseaux sociaux : des fiches claires que l&rsquo;on peut filtrer par
          type, județ, âge ou taille, et qui restent à jour — un animal adopté
          est marqué comme tel.
        </p>
        <p>
          Chaque fiche est publiée par la personne qui a l&rsquo;animal en
          garde — bénévole, association ou refuge — et mène directement à
          elle : un appel suffit.
        </p>
        <p>
          Vous avez un animal à faire adopter ?{" "}
          <Link
            href="/inregistrare"
            className="text-warm-ink underline underline-offset-4"
          >
            Créez un compte
          </Link>{" "}
          et publiez sa fiche en quelques minutes.
        </p>
      </div>
      <ButtonLink variant="outline" href="/animale" className="mt-6">
        Voir les animaux
      </ButtonLink>
    </main>
  );
}
