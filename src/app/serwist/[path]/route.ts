import { spawnSync } from "node:child_process";
import { createSerwistRoute } from "@serwist/turbopack";

// Révision de la page hors ligne préchargée : le SHA du commit suffit, et
// change donc à chaque déploiement. Si git n'est pas disponible dans le
// conteneur de build, un UUID tiré au build joue le même rôle.
const revision =
  spawnSync("git", ["rev-parse", "HEAD"], { encoding: "utf-8" }).stdout?.trim() ||
  crypto.randomUUID();

/**
 * Route qui compile et sert le service worker (`/serwist/sw.js`) — c'est la
 * voie Turbopack de Serwist : pas de plugin webpack, donc aucun `--webpack`
 * à traîner sur `next dev` et `next build`. La réponse porte l'en-tête
 * `Service-Worker-Allowed`, ce qui laisse le worker prendre pour périmètre
 * la racine du site alors qu'il est servi depuis /serwist/.
 */
export const { dynamic, dynamicParams, revalidate, generateStaticParams, GET } =
  createSerwistRoute({
    additionalPrecacheEntries: [{ url: "/~offline", revision }],
    swSrc: "src/app/sw.ts",
    useNativeEsbuild: true,
  });
