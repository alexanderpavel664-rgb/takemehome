/// <reference lib="esnext" />
/// <reference lib="webworker" />
import {
  CacheFirst,
  ExpirationPlugin,
  NetworkOnly,
  Serwist,
  StaleWhileRevalidate,
  type PrecacheEntry,
  type RuntimeCaching,
  type SerwistGlobalConfig,
} from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

/**
 * Stratégies de cache — volontairement écrites à la main plutôt que reprises
 * de `defaultCache` de Serwist, qui met les pages HTML et les charges RSC en
 * NetworkFirst : une annonce déjà adoptée pourrait alors ressortir du cache
 * sur un réseau qui flanche. C'est exactement ce que `page.tsx` de la fiche
 * interdit déjà (`export const dynamic = "force-dynamic"`, pour que le statut
 * « adopté », les photos et les coordonnées ne soient jamais périmés).
 *
 * La règle est donc : tout ce qui est immuable et versionné se met en cache,
 * tout ce qui raconte l'état d'un animal passe par le réseau. Le premier
 * matcher qui répond gagne — l'ordre compte.
 */
const runtimeCaching: RuntimeCaching[] = [
  {
    // L'authentification ne se met jamais en cache, dans aucun sens.
    matcher: ({ url: { pathname }, sameOrigin }) =>
      sameOrigin && pathname.startsWith("/api/auth/"),
    handler: new NetworkOnly(),
  },
  {
    // Sortie de build Next : noms de fichiers hachés, donc immuables — le JS,
    // le CSS et la police variable Plus Jakarta Sans (servie par next/font
    // depuis /_next/static/media). C'est le cœur du gain en 4G.
    matcher: ({ url: { pathname }, sameOrigin }) =>
      sameOrigin && pathname.startsWith("/_next/static/"),
    handler: new CacheFirst({
      cacheName: "next-static",
      plugins: [
        new ExpirationPlugin({
          maxEntries: 96,
          maxAgeSeconds: 365 * 24 * 60 * 60,
          maxAgeFrom: "last-used",
        }),
      ],
    }),
  },
  {
    // Photos passées par l'optimiseur next/image, et les originaux servis par
    // Vercel Blob : révalidées en arrière-plan, jamais bloquantes.
    matcher: ({ request, url: { pathname }, sameOrigin }) =>
      (sameOrigin && pathname.startsWith("/_next/image")) ||
      request.destination === "image",
    handler: new StaleWhileRevalidate({
      cacheName: "photos",
      plugins: [
        new ExpirationPlugin({
          maxEntries: 64,
          maxAgeSeconds: 30 * 24 * 60 * 60,
          maxAgeFrom: "last-used",
        }),
      ],
    }),
  },
  {
    // Icônes et manifeste : changent à chaque déploiement au plus.
    matcher: ({ url: { pathname }, sameOrigin }) =>
      sameOrigin &&
      (pathname.startsWith("/icons/") ||
        pathname === "/manifest.webmanifest" ||
        pathname === "/favicon.ico"),
    handler: new StaleWhileRevalidate({ cacheName: "app-icons" }),
  },
  {
    // Tout le reste — documents HTML, charges RSC, server actions, API :
    // réseau, toujours. Hors ligne, le `fallbacks` ci-dessous prend le relais
    // pour les navigations ; rien d'autre n'est servi depuis le cache.
    matcher: () => true,
    handler: new NetworkOnly(),
  },
];

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching,
  fallbacks: {
    entries: [
      {
        url: "/~offline",
        matcher({ request }) {
          return request.destination === "document";
        },
      },
    ],
  },
});

serwist.addEventListeners();
