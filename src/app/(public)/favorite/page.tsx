import type { Metadata } from "next";
import { STR } from "@/lib/strings";
import { FavoriteList } from "./favorite-list";

export const metadata: Metadata = {
  title: STR.favorite.metaTitle,
  // Propre à chaque navigateur, vide pour un robot : rien à indexer.
  robots: { index: false },
};

// Les favoris vivent dans le localStorage : le serveur ne rend que la
// coquille, la liste se construit dans le navigateur (favorite-list.tsx).
export default function FavoritePage() {
  return (
    <main className="px-4 py-4 md:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold text-warm-ink">
        {STR.favorite.title}
      </h1>
      <p className="mt-1 mb-4 max-w-[66ch] text-base text-warm-gray">
        {STR.favorite.intro}
      </p>
      <FavoriteList />
    </main>
  );
}
