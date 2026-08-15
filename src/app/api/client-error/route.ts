import * as Sentry from "@sentry/nextjs";
import { CLIENT_ERROR_EVENTS } from "@/lib/client-report";
import { isRateLimited } from "@/lib/rate-limit";
import { logError, safeFields, scrub, type LogFields } from "@/lib/log";

/**
 * Réception des erreurs signalées par le navigateur (src/lib/client-report.ts)
 * et relais vers Sentry côté serveur. C'est ce qui rend visible l'échec d'un
 * upload de photo, qui part du navigateur directement vers Vercel Blob et
 * ne touche donc jamais le serveur.
 *
 * La route est publique par nécessité (un plantage de rendu frappe aussi un
 * visiteur non connecté), donc trois verrous contre l'épuisement du quota
 * Sentry — 5 000 erreurs/mois sur l'offre gratuite :
 * - limite de débit par IP, comme les autres routes ;
 * - corps plafonné, lu en texte avant tout JSON.parse ;
 * - `event` restreint à une liste fermée.
 * La réponse est toujours 204, y compris en cas de rejet : rien n'apprend à
 * un attaquant lequel des trois verrous a joué, et le navigateur n'a aucune
 * décision à prendre.
 */

const MAX_BODY_BYTES = 4 * 1024;
// Fonction et non constante : un objet Response ne se renvoie qu'une fois.
const noContent = () => new Response(null, { status: 204 });

function truncate(value: unknown, max: number): string | undefined {
  return typeof value === "string" && value ? value.slice(0, max) : undefined;
}

// `context` vient du navigateur : on ne garde que des primitives, huit clés
// au plus, et safeFields() occulte ensuite tout nom sensible.
function parseContext(raw: unknown): LogFields {
  if (!raw || typeof raw !== "object") {
    return {};
  }
  const out: LogFields = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>).slice(0, 8)) {
    if (typeof value === "string") {
      out[key.slice(0, 40)] = value.slice(0, 200);
    } else if (typeof value === "number" || typeof value === "boolean") {
      out[key.slice(0, 40)] = value;
    }
  }
  return safeFields(out);
}

export async function POST(request: Request): Promise<Response> {
  try {
    if (await isRateLimited("client-error", request.headers)) {
      return noContent();
    }

    const body = await request.text();
    if (body.length > MAX_BODY_BYTES) {
      return noContent();
    }

    const payload = JSON.parse(body) as Record<string, unknown>;
    const event = payload.event;
    if (
      typeof event !== "string" ||
      !(CLIENT_ERROR_EVENTS as readonly string[]).includes(event)
    ) {
      return noContent();
    }

    const message = truncate(payload.message, 300) ?? "(sans message)";
    const fields: LogFields = {
      ...parseContext(payload.context),
      path: truncate(payload.path, 200),
      userAgent: truncate(request.headers.get("user-agent"), 200),
    };

    // Erreur synthétique : Sentry regroupe sur le couple nom + message, donc
    // tous les « photo_upload_failed » au même motif forment une seule issue,
    // et un sauveteur qui réessaie dix fois n'envoie pas dix emails.
    const error = new Error(scrub(message));
    error.name = `ClientError:${event}`;
    // La pile navigateur reste en pièce jointe plutôt qu'en `error.stack` :
    // l'analyseur de piles Node la découperait mal et brouillerait le
    // regroupement. Ici elle est lisible telle quelle dans l'issue.
    const clientStack = truncate(payload.stack, 2000);

    logError(`client.${event}`, error, fields);

    Sentry.captureException(error, {
      tags: { event: `client.${event}`, source: "browser" },
      extra: { ...safeFields(fields), clientStack: clientStack ? scrub(clientStack) : undefined },
    });
    await Sentry.flush(2000).catch(() => false);

    return noContent();
  } catch (error) {
    // JSON invalide, corps illisible… Un rapport d'erreur mal formé ne doit
    // pas produire une seconde erreur : on trace et on répond 204.
    logError("client_error.beacon_rejected", error);
    return noContent();
  }
}
