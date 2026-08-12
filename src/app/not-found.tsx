import { ButtonLink } from "@/components/ui/button";

/**
 * 404 racine — URL qui ne correspond à aucune route. Un lien mort est un
 * scénario courant, pas une exception : rendu dans le layout racine (sans
 * header public), l'écran se suffit — titre encre, explication gris chaud,
 * et le chemin évident vers /animale, ici LE bouton plein de l'écran
 * (La Règle de la Sortie).
 */
export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-2 px-6 py-16 text-center">
      <h1 className="text-2xl font-semibold text-warm-ink">
        Page introuvable
      </h1>
      <p className="max-w-md text-base text-warm-gray">
        Cette page n&rsquo;existe pas ou n&rsquo;existe plus.
      </p>
      <ButtonLink variant="primary" href="/animale" className="mt-4">
        Voir les animaux à adopter
      </ButtonLink>
    </main>
  );
}
