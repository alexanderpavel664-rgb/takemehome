import { Skeleton } from "@/components/ui/skeleton";

/**
 * Squelette de la fiche, aux dimensions du gabarit réel (lien retour, photo
 * 4:3, nom en Display, lignes de méta et de sections), en pulsation douce
 * ivoire ↔ crème. Sa présence permet aussi le préchargement partiel des
 * liens de la grille vers les fiches : la navigation est immédiate.
 */
export default function AnimalLoading() {
  return (
    <main aria-hidden className="mx-auto max-w-3xl p-4">
      {/* Lien « ← Tous les animaux » : texte dans une zone min-h-11. */}
      <div className="flex min-h-11 items-center">
        <Skeleton className="h-5 w-40" />
      </div>
      {/* Photo 4:3, mêmes coins et même hairline que le conteneur réel. */}
      <Skeleton className="mt-2 aspect-[4/3] border border-warm-border" />
      {/* Nom en Display : 32px/1.05 ≈ 34px. */}
      <Skeleton className="mt-3 h-[34px] w-1/2" />
      {/* Métadonnées puis lieu : corps 16px/1.5 = 24px. */}
      <Skeleton className="mt-1 h-6 w-2/3" />
      <Skeleton className="mt-1 h-6 w-1/3" />
      {/* Section : titre 18px (h-7) puis lignes de corps. */}
      <Skeleton className="mt-6 h-7 w-36" />
      <Skeleton className="mt-1 h-6 w-full" />
      <Skeleton className="mt-2 h-6 w-full" />
      <Skeleton className="mt-2 h-6 w-3/4" />
    </main>
  );
}
