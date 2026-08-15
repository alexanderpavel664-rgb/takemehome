"use server";

import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { clientIp } from "@/lib/client-ip";
import { logInfo } from "@/lib/log";
import { prisma } from "@/lib/prisma";
import { isRateLimited } from "@/lib/rate-limit";
import { reportError } from "@/lib/report";
import { STR } from "@/lib/strings";
import { ReportReason } from "@/generated/prisma/client";

export type ReportFormState = {
  /** Envoi accepté : le formulaire cède la place à la confirmation. */
  sent?: true;
  fieldErrors?: { reason?: string; message?: string };
  formError?: string;
} | null;

// Assez pour raconter ce qui cloche, pas assez pour servir de déversoir.
const MAX_MESSAGE_LENGTH = 1000;

/**
 * Signalement public — SANS compte : un adoptant qui repère une arnaque n'en
 * a pas, et lui en demander un reviendrait à ne recevoir aucun signalement.
 * L'ouverture se paie donc en garde-fous : limite de débit du WAF (clé
 * report:<ip>, sous la règle app-api existante), puis refus silencieux d'un
 * second signalement en attente venu de la même IP sur la même annonce.
 */
export async function createReport(
  _prevState: ReportFormState,
  formData: FormData,
): Promise<ReportFormState> {
  const requestHeaders = await headers();
  // Avant tout Prisma : une rafale rejetée ne coûte aucune requête Neon.
  if (await isRateLimited("report", requestHeaders)) {
    return { formError: STR.report.tooManyRequests };
  }

  const animalId = String(formData.get("animalId") ?? "");
  const rawReason = String(formData.get("reason") ?? "");
  const reason = (Object.values(ReportReason) as string[]).includes(rawReason)
    ? (rawReason as ReportReason)
    : null;
  const message = String(formData.get("message") ?? "").trim();

  if (!reason || message.length > MAX_MESSAGE_LENGTH) {
    return {
      fieldErrors: {
        ...(reason ? {} : { reason: STR.report.reasonRequired }),
        ...(message.length > MAX_MESSAGE_LENGTH
          ? { message: STR.report.messageTooLong }
          : {}),
      },
    };
  }

  // L'annonce doit exister et être publique : signaler une annonce déjà
  // masquée n'apprendrait rien à personne. notFound() reste HORS du try,
  // il fonctionne en levant une exception que le catch avalerait.
  const animal = await prisma.animal.findFirst({
    where: { id: animalId, hidden: false },
    select: { id: true },
  });
  if (!animal) {
    notFound();
  }

  const ip = clientIp(requestHeaders);

  try {
    // Doublon en attente depuis la même IP : on répond la même confirmation
    // sans rien écrire. Dire « tu as déjà signalé » donnerait à un harceleur
    // la mesure de ce qui passe et de ce qui ne passe pas.
    if (ip) {
      const existing = await prisma.report.findFirst({
        where: { animalId: animal.id, ip, status: "PENDING" },
        select: { id: true },
      });
      if (existing) {
        return { sent: true };
      }
    }

    await prisma.report.create({
      data: { animalId: animal.id, reason, message: message || null, ip },
    });
  } catch (error) {
    // Un signalement perdu, c'est une arnaque qui reste en ligne : on veut
    // le savoir. La saisie reste à l'écran, rien n'est à retaper.
    await reportError("report.create_failed", error, { animalId: animal.id });
    return { formError: STR.report.saveFailed };
  }

  // Trace ops : un pic de signalements se voit ici avant de se voir en base.
  // Ni l'IP ni le texte libre n'y entrent — seul le motif, qui est un enum.
  logInfo("report.created", { animalId: animal.id, reason });

  return { sent: true };
}
