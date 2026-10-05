"use server";

import { headers } from "next/headers";
import { verifyConfirmationToken } from "@/lib/confirmation-token";
import { logInfo } from "@/lib/log";
import { prisma } from "@/lib/prisma";
import { isRateLimited } from "@/lib/rate-limit";
import { reportError } from "@/lib/report";
import { STR } from "@/lib/strings";
import { AdoptionSource } from "@/generated/prisma/client";

export type ConfirmStep = "ask" | "available-done" | "source" | "source-done";

export type ConfirmState = {
  step: ConfirmStep;
  /** Masquée par la modération : le statut a changé, la visibilité non. */
  stillHidden?: boolean;
  formError?: string;
};

/**
 * Les deux gestes de la page /confirmare, sans session : c'est le lien
 * signé (relu ici, jamais cru sur parole depuis la page) qui autorise.
 *
 * intent=confirm — applique l'action du lien : AVAILABLE (« Încă
 *   disponibil ») ou ADOPTED (« A fost adoptat »). updatedAt avance
 *   explicitement : c'est ce qui clôt le cycle de confirmation, remet le
 *   compteur des 21 jours à zéro et, pour « Încă disponibil », remonte
 *   l'annonce en tête de liste. `hidden` (la modération) n'est jamais
 *   touché : une annonce masquée par l'équipe le reste.
 * intent=source — la réponse facultative à « L-a adoptat cineva care l-a
 *   găsit pe takemehome.ro? », seulement avec un lien « adopted » et sur
 *   une annonce adoptée.
 *
 * Un GET n'écrit jamais rien : les filtres de messagerie (Outlook Safe
 * Links…) ouvrent les liens des emails avant la personne. Seul ce POST,
 * déclenché par un bouton, change le statut.
 */
export async function submitConfirmation(
  prev: ConfirmState,
  formData: FormData,
): Promise<ConfirmState> {
  const s = STR.confirmari.page;
  const verified = verifyConfirmationToken(String(formData.get("token") ?? ""));
  if (!verified.ok) {
    return { ...prev, formError: s.invalid };
  }
  if (await isRateLimited("confirmation", await headers())) {
    return { ...prev, formError: s.tooManyRequests };
  }

  const { animalId, action } = verified;
  const animal = await prisma.animal.findUnique({
    where: { id: animalId },
    select: { status: true, hidden: true, user: { select: { suspended: true } } },
  });
  if (!animal) {
    return { ...prev, formError: s.missing };
  }
  // Un compte suspendu ne modifie plus ses annonces (/termeni, point 7) :
  // le lien signé ne lui rend pas ce droit.
  if (animal.user.suspended) {
    return { ...prev, formError: s.suspended };
  }

  try {
    if (formData.get("intent") === "source") {
      const raw = String(formData.get("source") ?? "");
      const source = (Object.values(AdoptionSource) as string[]).includes(raw)
        ? (raw as AdoptionSource)
        : null;
      if (action !== "adopted" || animal.status !== "ADOPTED" || !source) {
        return { ...prev, formError: s.failed };
      }
      await prisma.animal.update({
        where: { id: animalId },
        data: { adoptionSource: source },
      });
      logInfo("confirmation.adoption_source", { animalId, source });
      return { step: "source-done" };
    }

    const now = new Date();
    if (action === "available") {
      await prisma.animal.update({
        where: { id: animalId },
        data: { status: "AVAILABLE", adoptionSource: null, updatedAt: now },
      });
      logInfo("confirmation.available", { animalId, from: animal.status });
      return { step: "available-done", stillHidden: animal.hidden };
    }
    await prisma.animal.update({
      where: { id: animalId },
      data: { status: "ADOPTED", adoptionSource: null, updatedAt: now },
    });
    logInfo("confirmation.adopted", { animalId, from: animal.status });
    return { step: "source" };
  } catch (error) {
    await reportError("confirmation.save_failed", error, { animalId, action });
    return { ...prev, formError: s.failed };
  }
}
