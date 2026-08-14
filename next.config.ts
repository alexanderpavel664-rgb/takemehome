import type { NextConfig } from "next";
import { withSerwist } from "@serwist/turbopack";
import { BLOB_HOST } from "./src/lib/animal-photo";

const nextConfig: NextConfig = {
  // Pas d'indicateur de développement Next (le rond en bas à gauche) : il
  // n'appartient pas à l'interface, même en dev. Les erreurs de compilation
  // et d'exécution restent affichées.
  devIndicators: false,
  images: {
    // Autorise next/image à optimiser les photos du store Vercel Blob —
    // hostname exact du store uniquement, jamais de wildcard de sous-domaine.
    remotePatterns: [
      new URL(`https://${BLOB_HOST}/**`),
      // Photos de démonstration (scripts/seed-demo.mts) : images Unsplash
      // libres de droits, stockées en URL directe — rien dans le store Blob.
      // À retirer avec les données de démo si souhaité.
      // Forme objet obligatoire : un objet URL fige search à "" (query vide
      // exigée), or ces URLs portent ?w=1200&q=80. La query est épinglée —
      // seules les URLs du seed passent, pas tout Unsplash.
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
        search: "?w=1200&q=80",
      },
    ],
  },
};

// withSerwist branche la compilation du service worker sur Turbopack — le
// build et le dev restent ceux de Next, sans `--webpack`.
export default withSerwist(nextConfig);
