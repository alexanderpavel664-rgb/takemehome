import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/**
 * /robots.txt — tout est ouvert ; le fichier existe surtout pour annoncer le
 * sitemap aux moteurs de recherche. L'espace compte et la modération exigent
 * une session : un robot n'y voit que la page de connexion. Seules exceptions :
 * les pages /confirmare (un lien signé par email, propre à un publiant) et
 * les routes /api.
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
