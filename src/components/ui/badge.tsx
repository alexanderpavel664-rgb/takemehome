import type { ComponentProps } from "react";

/**
 * Pastille pleine vert forêt, texte blanc 600 — réservée au statut
 * « Adopté », la couleur de la bonne nouvelle ne sert à rien d'autre.
 * C'est la seule chose autorisée à recouvrir une photo.
 */
export function Badge({ className = "", ...props }: ComponentProps<"span">) {
  return (
    <span
      className={`inline-flex items-center rounded-pill bg-forest-adopted px-3 py-1 text-[13px]/[1.2] font-semibold text-white ${className}`}
      {...props}
    />
  );
}
