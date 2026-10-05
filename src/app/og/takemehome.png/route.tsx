import { renderOgCard } from "@/lib/og-card";

/**
 * La carte de partage du site à une adresse fixe : /og/takemehome.png (voir
 * SITE_OG_IMAGE dans lib/og-default.ts). Prérendue au build comme les
 * opengraph-image.tsx — même dessin, même module.
 */
export const dynamic = "force-static";

export function GET() {
  return renderOgCard();
}
