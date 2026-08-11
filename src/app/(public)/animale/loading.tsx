import { SkeletonGrid } from "../skeleton-grid";

/**
 * Squelette affiché à l'arrivée sur /animale (et préchargé par les liens
 * vers la liste : il rend la navigation immédiate sur réseau lent).
 * Les navigations qui ne changent que les searchParams (filtres,
 * « Vezi mai multe ») ne repassent pas par ce fichier.
 */
export default function AnimaleLoading() {
  return (
    <main className="mx-auto max-w-5xl p-4">
      <h1 className="mb-4 text-2xl font-bold">Animaux à adopter</h1>
      <SkeletonGrid />
    </main>
  );
}
