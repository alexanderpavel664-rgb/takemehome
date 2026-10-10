import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/**
 * /robots.txt — tout est ouvert ; le fichier existe surtout pour annoncer le
 * sitemap aux moteurs de recherche. Seules exceptions : les pages /confirmare
 * (un lien signé par email, propre à un publiant) et les routes /api.
 *
 * Les autres pages privées (compte, modération, authentification,
 * /favorite) restent volontairement ouvertes aux robots : elles portent un
 * noindex, et une page bloquée ici ne serait jamais lue — Google ne verrait
 * pas son noindex et pourrait indexer son adresse seule, sans contenu, dès
 * qu'un lien y mène (« Intră în cont » est sur toutes les pages).
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/confirmare/", "/api/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
