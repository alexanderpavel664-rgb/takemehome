import { STR } from "@/lib/strings";
import { SkeletonGrid } from "../skeleton-grid";

/** Squelette affiché à l'arrivée sur /adoptati — même gabarit pleine
 * largeur et même grille auto-fill que la page. */
export default function AdoptatiLoading() {
  return (
    <main className="px-4 py-4 md:px-6 lg:px-8">
      <h1 className="mb-4 text-2xl font-semibold text-warm-ink">
        {STR.adoptati.title}
      </h1>
      <SkeletonGrid />
    </main>
  );
}
