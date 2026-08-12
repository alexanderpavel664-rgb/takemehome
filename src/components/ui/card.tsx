import type { ComponentProps } from "react";

/**
 * Surface ivoire posée sur le papier crème : hairline #EAE1D2, rayon 20 px,
 * aucune ombre au repos (La Règle du Plat). Pas de padding par défaut —
 * le contenu classique ajoute `p-4`, les cartes photo gèrent leur bord.
 */
export function Card({ className = "", ...props }: ComponentProps<"div">) {
  return (
    <div
      className={`rounded-md border border-warm-border bg-card-ivory ${className}`}
      {...props}
    />
  );
}
