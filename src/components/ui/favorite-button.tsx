"use client";

import { STR } from "@/lib/strings";
import { toggleFavorite, useFavoriteIds } from "@/lib/favorites";

/** Le cœur, contour au repos, plein une fois enregistré. */
export function HeartIcon({ filled, className = "size-6" }: { filled: boolean; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  );
}

/**
 * Bouton cœur des cartes et de la fiche : ajoute ou retire l'annonce des
 * favoris du navigateur (lib/favorites.ts). Encre chaude, jamais terracotta
 * (La Règle Terracotta : une icône n'est pas une action pleine) ; l'état se
 * lit à la forme — contour ou plein — et aria-pressed le dit aux lecteurs
 * d'écran. Cible de 44 px. Jamais posé sur une photo : seule « Adoptat » en
 * a le droit.
 */
export function FavoriteButton({
  id,
  name,
  className = "",
}: {
  id: string;
  /** Sur une carte : le nom, pour distinguer les cœurs d'une grille. */
  name?: string;
  className?: string;
}) {
  const saved = useFavoriteIds().includes(id);
  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={name ? STR.favorite.toggleNamed(name) : STR.favorite.toggle}
      onClick={() => toggleFavorite(id)}
      className={
        "inline-flex size-11 shrink-0 items-center justify-center rounded-md text-warm-ink " +
        "hover:bg-warm-ink/5 active:bg-warm-ink/10 " +
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-warm-ink " +
        className
      }
    >
      <HeartIcon filled={saved} />
    </button>
  );
}
