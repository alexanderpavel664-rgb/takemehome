import { SITE_URL } from "@/lib/site";
import { STR } from "@/lib/strings";

/**
 * La carte de partage du site (lib/og-card.tsx), décrite sans la dessiner :
 * ce module ne lit aucun fichier, il peut entrer dans n'importe quelle page.
 * og-card.tsx, lui, charge ses polices au chargement du module — l'importer
 * depuis une page rendue à la requête embarquerait des lectures disque que
 * seules les routes prérendues au build peuvent se permettre.
 */
export const OG_ALT = `${STR.site.name} – ${STR.home.tagline}`;
export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

/**
 * La même carte à une adresse fixe (app/og/takemehome.png/route.tsx) — les
 * fichiers opengraph-image.tsx ont une adresse générée par Next, qu'une page
 * ne peut pas citer. Sert d'image Open Graph là où il n'y a pas de photo à
 * montrer : fiche sans photo, pages par județ.
 */
export const SITE_OG_IMAGE = {
  url: `${SITE_URL}/og/takemehome.png`,
  width: OG_SIZE.width,
  height: OG_SIZE.height,
  type: OG_CONTENT_TYPE,
  alt: OG_ALT,
};
