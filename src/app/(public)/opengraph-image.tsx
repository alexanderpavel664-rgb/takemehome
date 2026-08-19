import { OG_ALT, OG_CONTENT_TYPE, OG_SIZE, renderOgCard } from "@/lib/og-card";

/**
 * Carte de partage des pages publiques : /, /animale, /despre, /adoptati,
 * /confidentialitate, /termeni. Ce fichier doit rester dans ce segment-ci et
 * pas seulement à la racine : l'accueil déclare son propre `openGraph`, qui
 * écrase celui hérité de la racine — voir lib/og-card.tsx.
 *
 * Les fiches /animal/[id] ne sont pas concernées : elles déclarent
 * `openGraph.images` avec la photo de l'animal, qui reste prioritaire.
 */
export const alt = OG_ALT;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderOgCard();
}
