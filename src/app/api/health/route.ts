import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logError } from "@/lib/log";

/**
 * Route de diagnostic MANUEL : « est-ce que la base répond ? ».
 *
 * ⚠️ NE PAS BRANCHER DE MONITEUR EXTERNE DESSUS. Un ping toutes les cinq
 * minutes tiendrait le compute Neon éveillé 24h/24 et épuiserait le quota
 * gratuit sans un seul visiteur réel. Elle se consulte à la main, quand un
 * doute apparaît :
 *
 *     curl -s https://<domaine>/api/health | jq
 *
 * Poser HEALTH_TOKEN en variable d'environnement ferme la route à tout le
 * monde sauf `?token=…` : sans elle, un robot qui découvre l'URL et la
 * martèle réveille Neon à chaque passage. Tant que la variable est absente
 * (en local), la route reste ouverte.
 */

export const dynamic = "force-dynamic";

const DIAGNOSTIC_HEADERS = {
  // Ni cache CDN ni cache navigateur : une réponse en santé mise en cache
  // dirait « tout va bien » alors que la base est tombée depuis.
  "Cache-Control": "no-store",
  "X-Robots-Tag": "noindex",
};

export async function GET(request: Request): Promise<Response> {
  const expected = process.env.HEALTH_TOKEN;
  if (expected) {
    const token = new URL(request.url).searchParams.get("token");
    if (token !== expected) {
      // 404 et non 401 : rien ne révèle que la route existe, et surtout on
      // sort AVANT de toucher la base — donc sans réveiller Neon.
      return new NextResponse(null, { status: 404, headers: DIAGNOSTIC_HEADERS });
    }
  }

  const started = Date.now();
  try {
    // La requête la moins chère qui prouve un aller-retour complet :
    // connexion, authentification et réponse du pooler Neon.
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json(
      {
        status: "ok",
        database: "ok",
        latencyMs: Date.now() - started,
        environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
        commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null,
      },
      { headers: DIAGNOSTIC_HEADERS },
    );
  } catch (error) {
    // Log seul, pas d'alerte Sentry : la route n'est appelée qu'à la main,
    // et si la base est vraiment tombée, les vraies pages ont déjà alerté.
    logError("health.database_unreachable", error, {
      latencyMs: Date.now() - started,
    });
    return NextResponse.json(
      { status: "error", database: "unreachable", latencyMs: Date.now() - started },
      { status: 503, headers: DIAGNOSTIC_HEADERS },
    );
  }
}
