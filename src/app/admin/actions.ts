"use server";

import { revalidatePath } from "next/cache";
import { logInfo } from "@/lib/log";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/viewer";
import { ReportStatus } from "@/generated/prisma/client";

/**
 * Les trois leviers de la modération. Aucun ne touche au champ `role` :
 * il n'existe volontairement AUCUN chemin d'interface pour se donner (ou
 * donner) le rôle ADMIN — ce serait une escalade de privilèges. Le rôle se
 * pose à la main en base.
 *
 * Chaque action revérifie le rôle elle-même : une server action est un POST
 * ouvert à qui connaît son identifiant, pas un bouton dans une page.
 */

function text(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

/** Masque ou réaffiche une annonce. Réversible dans les deux sens. */
export async function setAnimalHidden(formData: FormData): Promise<void> {
  await requireAdmin();
  const animalId = text(formData, "animalId");
  const hidden = formData.get("hidden") === "1";

  // updateMany : un identifiant qui ne correspond à rien ne lève pas, il ne
  // touche simplement aucune ligne.
  const { count } = await prisma.animal.updateMany({
    where: { id: animalId },
    data: { hidden },
  });
  if (count > 0) {
    logInfo("admin.animal_hidden", { animalId, hidden });
  }

  revalidatePath("/admin");
}

/**
 * Suspend un compte — et masque d'un même geste toutes ses annonces, dans
 * une transaction : c'est ce que « ne peut plus publier » veut dire côté
 * public, et le masquage est porté par une colonne d'Animal pour que les
 * listes publiques n'aient jamais à joindre la table user.
 *
 * La réactivation ne réaffiche RIEN d'elle-même : chaque annonce masquée l'a
 * été après examen, les ressusciter en lot annulerait ce travail. L'ADMIN
 * les réaffiche une par une.
 *
 * Un compte ADMIN ne peut pas être suspendu (le filtre role: USER) : ni par
 * un autre ADMIN, ni par lui-même — personne ne se ferme la porte.
 */
export async function setUserSuspended(formData: FormData): Promise<void> {
  await requireAdmin();
  const userId = text(formData, "userId");
  const suspended = formData.get("suspended") === "1";

  if (suspended) {
    await prisma.$transaction([
      prisma.user.updateMany({
        where: { id: userId, role: "USER" },
        data: { suspended: true },
      }),
      // Le même filtre sur le rôle, porté par la relation : si la première
      // requête n'a rien suspendu (compte ADMIN, ou inexistant), la seconde
      // ne masque rien non plus.
      prisma.animal.updateMany({
        where: { userId, user: { role: "USER" } },
        data: { hidden: true },
      }),
    ]);
  } else {
    await prisma.user.updateMany({
      where: { id: userId },
      data: { suspended: false },
    });
  }
  logInfo("admin.user_suspended", { userId, suspended });

  revalidatePath("/admin");
}

/** Marque un signalement comme traité ou rejeté. */
export async function setReportStatus(formData: FormData): Promise<void> {
  await requireAdmin();
  const reportId = text(formData, "reportId");
  const raw = text(formData, "status");
  if (!(Object.values(ReportStatus) as string[]).includes(raw)) {
    return;
  }

  await prisma.report.updateMany({
    where: { id: reportId },
    data: { status: raw as ReportStatus },
  });

  revalidatePath("/admin");
}
