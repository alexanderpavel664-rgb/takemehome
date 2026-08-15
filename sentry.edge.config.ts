// Initialisation Sentry — runtime Edge. Chargé par src/instrumentation.ts.
//
// Un seul morceau de code tourne ici : src/proxy.ts, qui garde /cont. Il ne
// fait que lire un cookie, mais s'il jetait, personne ne pourrait plus entrer
// dans son compte — c'est exactement le genre de panne muette à couvrir.
//
// Mêmes verrous de collecte que sentry.server.config.ts : voir les
// commentaires détaillés là-bas.

import * as Sentry from "@sentry/nextjs";
import { scrubSentryEvent } from "./src/lib/sentry-scrub";

const dsn = process.env.SENTRY_DSN;

Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
  release: process.env.VERCEL_GIT_COMMIT_SHA,
  tracesSampleRate: 0,

  // À NE PAS SUPPRIMER — les défauts du SDK collectent cookies et en-têtes.
  dataCollection: {
    userInfo: false,
    cookies: false,
    httpHeaders: {
      request: { allow: ["user-agent", "accept-language", "referer", "x-vercel-id"] },
      response: false,
    },
    httpBodies: [],
    urlQueryParams: false,
    databaseQueryData: false,
    stackFrameVariables: false,
  },

  beforeSend: scrubSentryEvent,
});
