import { AnimalCardSkeleton } from "@/components/ui/skeleton";

/** Cartes squelettes pendant le chargement — jamais de page blanche. */
export function SkeletonGrid({
  count = 8,
  gridClassName = "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4",
}: {
  count?: number;
  gridClassName?: string;
}) {
  return (
    <ul aria-hidden className={gridClassName}>
      {Array.from({ length: count }, (_, i) => (
        <li key={i}>
          <AnimalCardSkeleton />
        </li>
      ))}
    </ul>
  );
}
