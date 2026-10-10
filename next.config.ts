import type { NextConfig } from "next";
import { HTML_LIMITED_BOT_UA_RE } from "next/dist/shared/lib/router/utils/html-bots";
import { withSerwist } from "@serwist/turbopack";
import { BLOB_HOST } from "./src/lib/animal-photo";

// Le domaine Vercel de production : il sert le même site que takemehome.ro.
const VERCEL_HOST = "takemehome-hazel.vercel.app";

const nextConfig: NextConfig = {
  // Pas d'indicateur de développement Next (le rond en bas à gauche) : il
  // n'appartient pas à l'interface, même en dev. Les erreurs de compilation
  // et d'exécution restent affichées.
  devIndicators: false,
  // Métadonnées dans le <head> pour Googlebot aussi. Par défaut, Next 16
  // les envoie en streaming aux robots qui exécutent le JavaScript : sur
  // une page à generateMetadata (la fiche, et son loading.tsx), titre,
  // description, canonical et robots arrivaient dans le <body> — et Google
  // n'accepte une canonical que dans le <head>. Un robot de cette liste
  // reçoit les métadonnées résolues avant tout le reste ; le prix est un
  // premier octet un peu plus tardif, pour les robots seulement.
  //
  // Cette option REMPLACE la liste par défaut (Bingbot, facebookexternalhit,
  // WhatsApp…) : on la reprend telle quelle depuis Next, et on y ajoute
  // Googlebot. Import interne à next/dist : si un jour il casse, c'est au
  // build, pas en silence.
  htmlLimitedBots: new RegExp(`${HTML_LIMITED_BOT_UA_RE.source}|Googlebot`, "i"),
  // Le domaine Vercel reste joignable (aucune redirection : la connexion
  // Google et les anciens liens y passent peut-être encore), mais hors des
  // index — sinon Google peut le prendre pour un double de takemehome.ro.
  async headers() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: VERCEL_HOST }],
        headers: [{ key: "X-Robots-Tag", value: "noindex" }],
      },
    ];
  },
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
