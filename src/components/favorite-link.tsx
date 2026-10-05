"use client";

import Link from "next/link";
import { useFavoriteIds } from "@/lib/favorites";
import { STR } from "@/lib/strings";
import { HeartIcon } from "@/components/ui/favorite-button";

/**
 * Accès à /favorite dans l'en-tête public : le cœur, et le nombre dès qu'il
 * y en a un. Gris chaud comme l'accès au compte — discret, jamais un bouton.
 * Le nombre n'existe qu'après l'hydratation (le serveur ne connaît pas le
 * localStorage) : avant, le lien est le même, sans chiffre.
 */
export function FavoriteLink() {
  const count = useFavoriteIds().length;
  return (
    <Link
      href="/favorite"
      aria-label={STR.favorite.headerLink(count)}
      className="flex min-h-11 min-w-11 items-center justify-center gap-1 rounded-md px-2 text-sm text-warm-gray focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-warm-ink"
    >
      <HeartIcon filled={count > 0} className="size-5" />
      {count > 0 && <span aria-hidden>{count}</span>}
    </Link>
  );
}
