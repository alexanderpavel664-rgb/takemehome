import { ButtonLink } from "@/components/ui/button";
import { SiteFooter } from "@/components/site-footer";
import { STR } from "@/lib/strings";

/**
 * 404 racine — URL qui ne correspond à aucune route. Un lien mort est un
 * scénario courant, pas une exception : rendu dans le layout racine (sans
 * header public), l'écran se suffit — titre encre, explication gris chaud,
 * et le chemin évident vers /animale, ici LE bouton plein de l'écran
 * (La Règle de la Sortie).
 */
export default function NotFound() {
  return (
    <>
    <main className="flex flex-1 flex-col items-center justify-center gap-2 px-6 py-16 text-center">
      <h1 className="text-2xl font-semibold text-warm-ink">
        {STR.notFound.title}
      </h1>
      <p className="max-w-md text-base text-warm-gray">
        {STR.notFound.description}
      </p>
      <ButtonLink variant="primary" href="/animale" className="mt-4">
        {STR.notFound.cta}
      </ButtonLink>
    </main>
    <SiteFooter />
    </>
  );
}
