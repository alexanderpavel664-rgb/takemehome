// Initialisation Sentry — runtime Node uniquement. Chargé par
// src/instrumentation.ts au démarrage du serveur.
//
// Installation SERVEUR SEULE, volontairement : il n'existe pas de
// `instrumentation-client.ts` dans ce projet, donc le SDK navigateur
// (~30 Ko gzip) n'entre jamais dans le graphe de modules et le bundle client
// ne bouge pas d'un octet. Les échecs qui se produisent dans le navigateur
// (upload direct vers Vercel Blob, plantage de rendu React) remontent par la
// balise maison de src/lib/client-report.ts, quelques centaines d'octets.
//
// Sans DSN, init() laisse le SDK désactivé : en local, rien ne part, seuls
// les logs JSON s'écrivent. Poser SENTRY_DSN dans .env.local pour tester.

import * as Sentry from "@sentry/nextjs";
import { scrubSentryEvent } from "./src/lib/sentry-scrub";

const dsn = process.env.SENTRY_DSN;

Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  // preview et production sont deux environnements distincts dans Sentry :
  // une erreur de préproduction ne doit pas déclencher la même alerte.
  environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
  // Relie une issue au commit déployé, sans rien avoir à configurer.
  release: process.env.VERCEL_GIT_COMMIT_SHA,

  // Aucune donnée de performance : le quota gratuit est réservé aux erreurs,
  // et les spans n'apprendraient rien qu'on ne voie déjà dans Vercel.
  tracesSampleRate: 0,

  // ——— Ce que le SDK a le droit de collecter. ———
  // À NE PAS SUPPRIMER. Les défauts du SDK 10.x collectent cookies, en-têtes,
  // corps de requêtes, paramètres de requêtes SQL ET les variables locales
  // des piles d'appels — une variable `password` dans le chemin de connexion
  // partirait telle quelle. `sendDefaultPii` est déprécié depuis la 10.x,
  // c'est `dataCollection` qui commande.
  dataCollection: {
    userInfo: false,
    cookies: false,
    // ⚠️ Cette liste blanche NE FILTRE PAS en 10.70 — vérifié par un envoi
    // réel, un en-tête `authorization` la traverse intact. Elle reste posée
    // par correction, mais le filtrage qui compte est celui de
    // scrubSentryEvent() ci-dessous. Ne pas s'y fier seule.
    httpHeaders: {
      request: { allow: ["user-agent", "accept-language", "referer", "x-vercel-id"] },
      response: false,
    },
    httpBodies: [],
    // Les rappels OAuth portent le code et le state dans la query.
    urlQueryParams: false,
    databaseQueryData: false,
    stackFrameVariables: false,
  },

  // Le filet qui compte vraiment : secrets masqués et en-têtes réduits à la
  // liste blanche. Voir src/lib/sentry-scrub.ts pour le détail.
  beforeSend: scrubSentryEvent,
});
