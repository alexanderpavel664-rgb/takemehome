import { ButtonLink } from "@/components/ui/button";

/**
 * Id inexistant (ou animal supprimé) → 404 propre : un lien Facebook mort
 * est un scénario courant, pas une exception. Ici, LE bouton plein de
 * l'écran mène vers /animale — c'est lui l'action qui compte
 * (La Règle de la Sortie).
 */
export default function AnimalNotFound() {
  return (
    <main className="mx-auto max-w-3xl p-4 text-center">
      <h1 className="mt-10 text-2xl font-semibold text-warm-ink">
        Animal introuvable
      </h1>
      <p className="mt-2 text-base text-warm-gray">
        Cet animal n&rsquo;existe pas ou n&rsquo;est plus publié.
      </p>
      <p className="mt-6">
        <ButtonLink href="/animale" variant="primary">
          Voir les animaux à adopter
        </ButtonLink>
      </p>
    </main>
  );
}
