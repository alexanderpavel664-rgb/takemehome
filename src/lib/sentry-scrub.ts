import { scrub } from "@/lib/log";

/**
 * Dernier filtre appliqué à un événement Sentry avant l'envoi.
 *
 * POURQUOI CE FICHIER EXISTE. `dataCollection.httpHeaders.request.allow` ne
 * filtre PAS en SDK 10.70 : vérifié en local, un en-tête `authorization`
 * traverse la liste blanche et arrive intact dans l'événement (le
 * `cookies: false` voisin, lui, fonctionne). Comme le SDK attache la requête
 * entrante à tout `captureException` levé dans un route handler ou une
 * server action, un jeton de session serait parti à chaque alerte.
 * L'application de la liste blanche se fait donc ici, dans du code qu'on
 * maîtrise et qui tourne sur TOUS les événements, quelle que soit leur
 * origine. Ne pas retirer en se fiant à la configuration `dataCollection`
 * sans avoir revérifié avec un vrai envoi.
 */

// Les seuls en-têtes qui ressortent. Ni cookie, ni authorization, ni
// x-real-ip / x-forwarded-for (l'IP est une donnée personnelle au sens du
// RGPD). Ceux-ci disent l'appareil et le réseau, ce qu'il faut pour
// comprendre un échec sur un téléphone en 4G.
const ALLOWED_HEADERS = ["user-agent", "accept-language", "referer", "x-vercel-id"];

type ScrubbableEvent = {
  message?: string;
  request?: {
    headers?: Record<string, string>;
    cookies?: Record<string, string>;
    data?: unknown;
    query_string?: unknown;
  };
  exception?: { values?: { value?: string }[] };
  breadcrumbs?: { message?: string }[];
};

export function scrubSentryEvent<T extends ScrubbableEvent>(event: T): T {
  // Le message d'une erreur Prisma cite la chaîne de connexion Neon, mot de
  // passe compris. scrub() masque aussi téléphones et emails.
  if (event.message) {
    event.message = scrub(event.message);
  }
  for (const exception of event.exception?.values ?? []) {
    if (exception.value) {
      exception.value = scrub(exception.value);
    }
  }
  for (const breadcrumb of event.breadcrumbs ?? []) {
    if (breadcrumb.message) {
      breadcrumb.message = scrub(breadcrumb.message);
    }
  }

  if (event.request) {
    const headers = event.request.headers;
    if (headers) {
      const kept: Record<string, string> = {};
      for (const name of ALLOWED_HEADERS) {
        const value = headers[name];
        if (typeof value === "string") {
          kept[name] = scrub(value);
        }
      }
      event.request.headers = kept;
    }
    // Ceintures et bretelles : `cookies: false` et `httpBodies: []` sont déjà
    // posés côté configuration, mais l'un des deux s'est déjà révélé
    // inopérant — on ne fait plus confiance sans supprimer soi-même.
    delete event.request.cookies;
    delete event.request.data;
    delete event.request.query_string;
  }

  return event;
}
