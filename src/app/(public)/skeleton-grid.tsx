/** Cartes squelettes pendant le chargement — jamais de page blanche. */
export function SkeletonGrid({ count = 8 }: { count?: number }) {
  return (
    <ul
      aria-hidden
      className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
    >
      {Array.from({ length: count }, (_, i) => (
        <li key={i} className="animate-pulse border">
          <div className="aspect-[4/3] bg-gray-200" />
          <div className="space-y-2 p-2">
            <div className="h-4 w-2/3 bg-gray-200" />
            <div className="h-3 w-full bg-gray-200" />
            <div className="h-3 w-1/3 bg-gray-200" />
          </div>
        </li>
      ))}
    </ul>
  );
}
