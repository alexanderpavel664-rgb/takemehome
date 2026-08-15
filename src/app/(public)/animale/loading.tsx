import { STR } from "@/lib/strings";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SkeletonGrid } from "../skeleton-grid";

/**
 * Squelette affiché à l'arrivée sur /animale (et préchargé par les liens
 * vers la liste : il rend la navigation immédiate sur réseau lent).
 * Même h1 et même gabarit que la page — pleine largeur aux mêmes
 * gouttières, colonne de filtres desktop en squelette (w-64 xl:w-72) et
 * même grille auto-fill que SkeletonGrid/AnimalGrid, pour que le contenu
 * réel arrive sans saut de mise en page. Les navigations qui ne changent
 * que les searchParams (filtres, « Vezi mai multe ») ne repassent pas par
 * ce fichier.
 */
export default function AnimaleLoading() {
  return (
    <main className="px-4 py-4 md:px-6 lg:px-8">
      <h1 className="mb-4 text-2xl font-semibold text-warm-ink">
        {STR.animale.title}
      </h1>
      <div className="flex items-start lg:gap-8">
        {/* Colonne de filtres au gabarit exact de FilterAside : w-64 sans
            variante xl (une largeur xl inventée décalait toute la grille de
            32 px, assez pour faire tomber l'auto-fill de 4 à 3 colonnes). */}
        <div aria-hidden className="hidden w-64 shrink-0 lg:block">
          <Card className="p-4">
            {/* Titre « Filtres » : 18px/28, mb-4. */}
            <Skeleton className="mb-4 h-7 w-1/2" />
            {/* Quatre champs (label + Select = 72 px) puis le fieldset de
                chips (252 px à cette largeur fixe), en space-y-4. */}
            <div className="space-y-4">
              <Skeleton className="h-[72px]" />
              <Skeleton className="h-[72px]" />
              <Skeleton className="h-[72px]" />
              <Skeleton className="h-[72px]" />
              <Skeleton className="h-[252px]" />
            </div>
            {/* « Appliquer » — seul bouton de la colonne au repos. */}
            <Skeleton className="mt-4 h-12" />
          </Card>
        </div>
        <div className="min-w-0 flex-1">
          {/* Rangée d'onglets puis bouton « Filtrează » mobile : mêmes
              hauteurs que le contenu réel, pour un remplacement sans saut. */}
          <div aria-hidden className="border-b border-warm-border">
            <Skeleton className="h-11 w-64 max-w-full" />
          </div>
          <div aria-hidden className="my-4 lg:hidden">
            <Skeleton className="h-12 w-32" />
          </div>
          <div className="mt-4">
            <SkeletonGrid />
          </div>
        </div>
      </div>
    </main>
  );
}
