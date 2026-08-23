"use server";

import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { logInfo } from "@/lib/log";
import { loginHref } from "@/lib/next-path";
import { prisma } from "@/lib/prisma";
import { purgeExpiredReports } from "@/lib/purge-reports";
import { isRateLimited } from "@/lib/rate-limit";
import { reportError } from "@/lib/report";
import { STR } from "@/lib/strings";
import { getViewer } from "@/lib/viewer";
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
 * Signalement d'une annonce — depuis un compte connecté. Le compte est la
 * mesure anti-harcèlement : la limite de débit du WAF compte par compte
 * (clé report:<userId>, sous la règle app-api existante), puis un second
 * signalement en attente du même compte sur la même annonce est refusé en
 * silence. Rien n'est plus à stocker sur qui signale : ni IP, ni empreinte.
 */
export async function createReport(
  _prevState: ReportFormState,
  formData: FormData,
): Promise<ReportFormState> {
  const animalId = String(formData.get("animalId") ?? "");

  // La page a déjà renvoyé l'anonyme vers /login, mais une session peut
  // expirer entre l'ouverture du formulaire et l'envoi : même chemin, qui
  // ramène ici. redirect() lève une exception, il reste hors de tout try.
  const viewer = await getViewer();
  if (!viewer) {
    redirect(loginHref(`/animal/${animalId}/semnaleaza`));
  }

  // Avant tout autre Prisma : une rafale rejetée ne coûte rien de plus que
  // la lecture de session qui précède.
  const requestHeaders = await headers();
  if (await isRateLimited("report", requestHeaders, viewer.id)) {
    return { formError: STR.report.tooManyRequests };
  }

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

  try {
    // Doublon en attente du même compte : on répond la même confirmation
    // sans rien écrire. Dire « tu as déjà signalé » donnerait à un harceleur
    // la mesure de ce qui passe et de ce qui ne passe pas.
    const existing = await prisma.report.findFirst({
      where: { animalId: animal.id, userId: viewer.id, status: "PENDING" },
      select: { id: true },
    });
    if (existing) {
      return { sent: true };
    }

    await prisma.report.create({
      data: {
        animalId: animal.id,
        userId: viewer.id,
        reason,
        message: message || null,
      },
    });
  } catch (error) {
    // Un signalement perdu, c'est une arnaque qui reste en ligne : on veut
    // le savoir. La saisie reste à l'écran, rien n'est à retaper.
    await reportError("report.create_failed", error, { animalId: animal.id });
    return { formError: STR.report.saveFailed };
  }

  // Trace ops : un pic de signalements se voit ici avant de se voir en base.
  // Ni le compte ni le texte libre n'y entrent — seul le motif, qui est un
  // enum. Qui a signalé se lit dans /admin, pas dans les journaux.
  logInfo("report.created", { animalId: animal.id, reason });

  // Deuxième point d'appel de la purge opportuniste, après l'écriture
  // réussie : le chemin est déjà passé par la limite de débit et n'est donc
  // pas un levier pour marteler la base. Voir purgeExpiredReports.
  await purgeExpiredReports();

  return { sent: true };
}
