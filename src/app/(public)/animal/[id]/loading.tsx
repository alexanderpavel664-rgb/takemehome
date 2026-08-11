/**
 * Squelette de la fiche. Sa présence permet aussi le préchargement partiel
 * des liens de la grille vers les fiches : la navigation est immédiate.
 */
export default function AnimalLoading() {
  return (
    <main aria-hidden className="mx-auto max-w-3xl animate-pulse p-4">
      <div className="aspect-[4/3] bg-gray-200" />
      <div className="mt-4 h-7 w-1/2 bg-gray-200" />
      <div className="mt-2 h-4 w-2/3 bg-gray-200" />
      <div className="mt-2 h-4 w-1/3 bg-gray-200" />
      <div className="mt-6 h-4 w-full bg-gray-200" />
      <div className="mt-2 h-4 w-full bg-gray-200" />
      <div className="mt-2 h-4 w-3/4 bg-gray-200" />
    </main>
  );
}
