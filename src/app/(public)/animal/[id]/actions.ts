"use server";

import { headers } from "next/headers";
import { REQUEST_THROTTLE_DAYS } from "@/lib/confirmations";
import { logInfo } from "@/lib/log";
import { prisma } from "@/lib/prisma";
import { isRateLimited } from "@/lib/rate-limit";
import { reportError } from "@/lib/report";
import { STR } from "@/lib/strings";

export type AdoptionSignalState = { sent?: true; formError?: string } | null;

const CUID = /^c[a-z0-9]{24}$/;

/**
 * « A fost deja adoptat? » — le lien de la fiche pour l'adoptant, qui n'a
 * pas de compte (les signalements, eux, en exigent un). Il ne change PAS le
 * statut : il demande au publiant de confirmer, en posant
 * confirmRequestedAt ; la tâche du lendemain matin envoie l'email de
 * confirmation sans attendre les 21 jours (lib/confirmations.ts). Passer
 * par la tâche garde tous les envois sous le même plafond quotidien : ce
 * bouton ne peut pas vider le quota Resend.
 *
 * Deux limites : le WAF par IP (rafales), et au plus une demande par
 * annonce tous les REQUEST_THROTTLE_DAYS jours, tenue par la base elle-même
 * dans le WHERE. Rien n'est stocké sur qui a cliqué. La réponse est la même
 * qu'il y ait eu écriture ou non : elle ne dit pas si quelqu'un d'autre a
 * déjà cliqué.
 *
 * SQL brut : une demande n'est pas une modification de l'annonce,
 * updatedAt ne doit pas bouger (il clôturerait la demande elle-même).
 */
export async function signalAdopted(
  _prev: AdoptionSignalState,
  formData: FormData,
): Promise<AdoptionSignalState> {
  if (await isRateLimited("adoption-signal", await headers())) {
    return { formError: STR.adoptionSignal.tooManyRequests };
  }
  const animalId = String(formData.get("animalId") ?? "");
  if (!CUID.test(animalId)) {
    return { sent: true };
  }
  try {
    const written = await prisma.$executeRaw`
      UPDATE "Animal" SET "confirmRequestedAt" = (now() AT TIME ZONE 'UTC')
      WHERE "id" = ${animalId}
        AND "status" = 'AVAILABLE'
        AND "hidden" = false
        AND ("confirmRequestedAt" IS NULL
          OR "confirmRequestedAt" < (now() AT TIME ZONE 'UTC') - make_interval(days => ${REQUEST_THROTTLE_DAYS}))`;
    if (written > 0) {
      logInfo("confirmation.requested", { animalId });
    }
  } catch (error) {
    await reportError("confirmation.request_failed", error, { animalId });
    return { formError: STR.adoptionSignal.failed };
  }
  return { sent: true };
}
