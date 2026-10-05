import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/**
 * /robots.txt — tout est ouvert ; le fichier n'existe que pour annoncer le
 * sitemap aux moteurs de recherche. L'espace compte et la modération exigent
 * une session : un robot n'y voit que la page de connexion.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
