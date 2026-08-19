import { OG_ALT, OG_CONTENT_TYPE, OG_SIZE, renderOgCard } from "@/lib/og-card";

/**
 * Carte de partage des routes hors du groupe (public) : /login, /inregistrare,
 * et par héritage /cont et /admin. Le dessin et la raison d'être des deux
 * fichiers sont documentés dans lib/og-card.tsx.
 */
export const alt = OG_ALT;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderOgCard();
}
