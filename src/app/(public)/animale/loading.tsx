import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SkeletonGrid } from "../skeleton-grid";

/**
 * Squelette affiché à l'arrivée sur /animale (et préchargé par les liens
 * vers la liste : il rend la navigation immédiate sur réseau lent).
 * Même h1 et même gabarit que la page — colonne de filtres desktop en
 * squelette et grille plafonnée à 3 colonnes en lg, pour que le contenu
 * réel arrive sans saut de mise en page. Les navigations qui ne changent
 * que les searchParams (filtres, « Vezi mai multe ») ne repassent pas par
 * ce fichier.
 */
export default function AnimaleLoading() {
  return (
    <main className="mx-auto max-w-5xl p-4">
      <h1 className="mb-4 text-2xl font-semibold text-warm-ink">
        Animaux à adopter
      </h1>
      <div className="flex items-start lg:gap-8">
        <div aria-hidden className="hidden w-64 shrink-0 lg:block">
          <Card className="space-y-4 p-4">
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-24 w-full" />
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
            <SkeletonGrid gridClassName="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-3" />
          </div>
        </div>
      </div>
    </main>
  );
}
