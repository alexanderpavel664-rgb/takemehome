import * as Sentry from "@sentry/nextjs";
import type { Instrumentation } from "next";
import { logError } from "@/lib/log";

/**
 * Point d'entrée d'observabilité (convention Next.js). `register` tourne une
 * fois au démarrage de chaque instance de serveur, `onRequestError` à chaque
 * erreur serveur non rattrapée : rendu de composant serveur, route handler,
 * server action, proxy. C'est le filet qui attrape ce que personne n'a prévu
 * — dont un plantage pendant la création ou la modification d'un animal.
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }
}

// En-têtes transmis à Sentry. Tout le reste est jeté avant l'envoi : le
// cookie porte la session, x-real-ip et x-forwarded-for portent une donnée
// personnelle au sens du RGPD. Ceux-ci disent l'appareil et le réseau —
// exactement ce qu'il faut pour comprendre un échec sur un téléphone en 4G.
const REPORTED_HEADERS = ["user-agent", "accept-language", "referer", "x-vercel-id"];

// redirect() et notFound() lèvent une erreur : c'est leur mécanique normale.
// Next les traite avant d'arriver ici, mais un seul passage à travers
// suffirait à noyer la boîte mail sous des alertes pour un 404.
function isNavigationSignal(error: unknown): boolean {
  const digest = (error as { digest?: unknown } | null)?.digest;
  if (typeof digest !== "string") {
    return false;
  }
  return (
    digest.startsWith("NEXT_REDIRECT") ||
    digest === "NEXT_NOT_FOUND" ||
    digest === "NEXT_HTTP_ERROR_FALLBACK;404"
  );
}

export const onRequestError: Instrumentation.onRequestError = (
  error,
  request,
  context,
) => {
  if (isNavigationSignal(error)) {
    return;
  }

  const reportedHeaders: Record<string, string | string[]> = {};
  for (const name of REPORTED_HEADERS) {
    const value = request.headers[name];
    if (value !== undefined) {
      reportedHeaders[name] = value;
    }
  }

  // Le log JSON part dans tous les cas : si le quota Sentry est épuisé ou si
  // l'envoi échoue, la trace reste cherchable dans les logs Vercel.
  logError(`server.${context.routeType}_error`, error, {
    routePath: context.routePath,
    routeType: context.routeType,
    method: request.method,
    // Le chemin peut porter une query : scrub() s'en charge dans logError.
    path: request.path,
  });

  Sentry.captureRequestError(
    error,
    { ...request, headers: reportedHeaders },
    context,
  );
};
