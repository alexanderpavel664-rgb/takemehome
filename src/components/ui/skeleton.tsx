import type { ComponentProps } from "react";

/**
 * Bloc de chargement en pulsation douce ivoire ↔ crème (jamais de gris
 * froid), immobile sous prefers-reduced-motion — il reste alors un aplat
 * crème statique. Jamais de page blanche, jamais de spinner plein écran.
 */
export function Skeleton({ className = "", ...props }: ComponentProps<"div">) {
  return (
    <div
      aria-hidden
      className={`animate-pulse-paper rounded-md bg-cream-ground motion-reduce:animate-none ${className}`}
      {...props}
    />
  );
}

/**
 * Squelette aux dimensions exactes d'AnimalCard : même ratio photo, mêmes
 * coins (20 px carte / 19 px photo), même hairline, mêmes hauteurs de texte
 * — et même @container : padding et lignes de métadonnées suivent les
 * variantes @sm de la vraie carte, au pixel près.
 */
export function AnimalCardSkeleton() {
  return (
    <div
      aria-hidden
      className="@container rounded-md border border-warm-border bg-card-ivory"
    >
      <div className="aspect-[4/3] animate-pulse-paper rounded-t-[19px] bg-cream-ground motion-reduce:animate-none" />
      <div className="p-3 @sm:p-4">
        {/* Nom 19px/1.2 ≈ 23px ; métadonnées 13px/1.4 ≈ 18px, puis
            text-sm (14px/20px) en cellule large. */}
        <Skeleton className="h-[23px] w-2/3" />
        <Skeleton className="mt-1 h-[18px] w-full @sm:h-5" />
        <Skeleton className="h-[18px] w-1/3 @sm:h-5" />
      </div>
    </div>
  );
}
