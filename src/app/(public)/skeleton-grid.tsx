import { AnimalCardSkeleton } from "@/components/ui/skeleton";

/**
 * Cartes squelettes pendant le chargement — jamais de page blanche.
 * Même grille que AnimalGrid : 2 colonnes sur mobile, auto-fill ≥ 260px
 * dès md — le contenu réel remplace les squelettes sans saut.
 */
export function SkeletonGrid({ count = 8 }: { count?: number }) {
  return (
    <ul
      aria-hidden
      className="grid grid-cols-2 gap-3 md:grid-cols-[repeat(auto-fill,minmax(260px,1fr))] md:gap-4"
    >
      {Array.from({ length: count }, (_, i) => (
        <li key={i}>
          <AnimalCardSkeleton />
        </li>
      ))}
    </ul>
  );
}
