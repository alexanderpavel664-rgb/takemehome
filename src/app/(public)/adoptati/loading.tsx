import { SkeletonGrid } from "../skeleton-grid";

/** Squelette affiché à l'arrivée sur /adoptati. */
export default function AdoptatiLoading() {
  return (
    <main className="mx-auto max-w-5xl p-4">
      <h1 className="mb-4 text-2xl font-semibold text-warm-ink">
        Și-au găsit o familie
      </h1>
      <SkeletonGrid />
    </main>
  );
}
