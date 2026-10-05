import type { NextConfig } from "next";
import { withSerwist } from "@serwist/turbopack";
import { BLOB_HOST } from "./src/lib/animal-photo";

const nextConfig: NextConfig = {
  // Pas d'indicateur de développement Next (le rond en bas à gauche) : il
  // n'appartient pas à l'interface, même en dev. Les erreurs de compilation
  // et d'exécution restent affichées.
  devIndicators: false,
  images: {
    // Largeurs générées (V3, octobre 2026) : chaque couple photo × largeur
    // coûte une transformation Vercel (5 000 par mois sur Hobby, recalculées
    // à l'expiration du cache, ~30 jours), et une annonce a maintenant
    // jusqu'à 4 photos. Les sources ne dépassent jamais 1600 px
    // (lib/compress-image.ts) : 1920, 2048 et 3840 rendaient le même fichier
    // de 1600 sous trois clés. Quatre largeurs couvrent tout : cartes (640 /
    // 828), téléphones à 3× (1200), fiche sur écran Retina (1600).
    // imageSizes vide : seul AnimalPhoto utilise next/image, et ses `sizes`
    // en vw tomberaient sinon sur 384 en plus.
    deviceSizes: [640, 828, 1200, 1600],
    imageSizes: [],
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
