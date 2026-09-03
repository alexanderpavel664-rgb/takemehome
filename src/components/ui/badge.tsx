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

/**
 * Pastille pleine terracotta : l'échéance « Până la … » d'une annonce, et
 * rien d'autre. Exception délibérée à La Règle Terracotta (décision V2,
 * septembre 2026) : la couleur de l'action pour l'urgence d'un refuge —
 * acceptable parce qu'elle est rare par construction : une date, pas une
 * case, et le badge ne vit que les derniers jours (deadlineLabel dans
 * lib/animal-display.ts). Jamais sur la photo : dans la zone de texte de
 * la carte, à côté du nom sur la fiche.
 *
 * Blanc/terracotta mesure 4,49:1 — le même rapport que le bouton d'appel,
 * assumé pour lui en 600 ≥ 19 px ; ici à 13 px c'est un cheveu sous le AA.
 * Si l'écran réel déçoit, monter la taille, jamais la graisse (DESIGN.md).
 */
export function DeadlineBadge({
  className = "",
  ...props
}: ComponentProps<"span">) {
  return (
    <span
      className={`inline-flex items-center rounded-pill bg-terracotta px-3 py-1 text-[13px]/[1.2] font-semibold text-white ${className}`}
      {...props}
    />
  );
}

/**
 * Pastille discrète — hairline sur ivoire, encre 400 : une information
 * (« 3 pui »), pas un état. Le même dessin que la pastille de statut de
 * /cont ; jamais sur la photo.
 */
export function Pill({ className = "", ...props }: ComponentProps<"span">) {
  return (
    <span
      className={`inline-flex items-center rounded-pill border border-warm-border bg-card-ivory px-3 py-1 text-[13px]/[1.2] text-warm-ink ${className}`}
      {...props}
    />
  );
}
