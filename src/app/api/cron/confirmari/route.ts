import { timingSafeEqual } from "node:crypto";
import { renderConfirmationEmail } from "@/lib/confirmation-email";
import { bucharestDay, runConfirmations } from "@/lib/confirmations";
import { isEmailConfigured, sendEmail } from "@/lib/email";
import { logInfo } from "@/lib/log";
import { prisma } from "@/lib/prisma";
import { reportError } from "@/lib/report";

// Une exécution par jour (vercel.json). Une soixantaine d'envois Resend,
// séquentiels, tiennent en une vingtaine de secondes : 60 s laissent de la
// marge, sans laisser une tâche bloquée tourner indéfiniment.
export const maxDuration = 60;
export const dynamic = "force-dynamic";

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return false;
  }
  const given = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

/**
 * GET /api/cron/confirmari — le passage quotidien de la confirmation des
 * annonces (lib/confirmations.ts), déclenché par Vercel Cron.
 *
 * Deux verrous :
 * - CRON_SECRET : Vercel l'envoie dans l'en-tête Authorization ; sans lui,
 *   401 (doc Vercel, « Securing cron jobs »). Variable absente = 401 aussi.
 * - CONFIRMARI_ACTIVE=1 : sans elle la tâche répond sans rien faire, AVANT
 *   toute requête en base (la branche Neon reste endormie). Déployée
 *   éteinte ; l'opérateur la pose sur Vercel après avoir validé le mode à
 *   blanc (npm run confirmari).
 *
 * Réponse : des compteurs seulement, ni adresse ni identifiant.
 */
export async function GET(request: Request): Promise<Response> {
  if (!authorized(request)) {
    return new Response("Unauthorized", { status: 401 });
  }
  if (process.env.CONFIRMARI_ACTIVE !== "1" || !isEmailConfigured()) {
    return Response.json({ active: false });
  }

  const now = new Date();
  const day = bucharestDay(now);
  try {
    const summary = await runConfirmations({
      db: prisma,
      now,
      send: async (email) => {
        const { subject, text, html } = renderConfirmationEmail(email, now);
        await sendEmail({
          to: email.user.email,
          subject,
          text,
          html,
          idempotencyKey: `confirmari/${email.user.id}/${day}`,
        });
      },
      onFailure: (error, email) =>
        reportError("confirmation.send_failed", error, {
          animals: email.animals.length,
        }),
    });
    logInfo("confirmation.run", summary);
    return Response.json({ active: true, ...summary });
  } catch (error) {
    await reportError("confirmation.run_failed", error);
    return Response.json({ active: true, error: true }, { status: 500 });
  }
}
