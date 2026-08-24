import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
import { isRateLimited } from "@/lib/rate-limit";
import { STR } from "@/lib/strings";

const handler = toNextJsHandler(auth);

export const GET = handler.GET;

/**
 * Chemin qui déclenche un email vers une adresse choisie par n'importe qui,
 * sans compte. Avant better-auth (et donc avant Neon et Resend), le WAF
 * compte password-reset:<ip> sous la règle app-api (lib/rate-limit.ts) :
 * une rafale est coupée au bord, sans brûler le quota Resend ni la
 * réputation du domaine. La limite better-auth du même chemin (3 / 15 min,
 * auth.ts) reste derrière pour le goutte-à-goutte.
 *
 * 429 sans code : authErrorMessage lit le statut, comme pour les 429 de
 * better-auth. Le corps en roumain n'est là que pour qui l'ouvre à la main.
 */
const RESET_REQUEST_PATH = "/api/auth/request-password-reset";

export async function POST(request: Request): Promise<Response> {
  if (
    new URL(request.url).pathname === RESET_REQUEST_PATH &&
    (await isRateLimited("password-reset", request.headers))
  ) {
    return Response.json(
      { message: STR.auth.errors.rateLimited },
      { status: 429 },
    );
  }
  return handler.POST(request);
}
