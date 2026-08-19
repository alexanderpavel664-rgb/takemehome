import { logInfo } from "@/lib/log";
import { prisma } from "@/lib/prisma";
import { reportError } from "@/lib/report";

/**
 * Durée de conservation des signalements, annoncée au point 4 de
 * /confidentialitate (« 6 luni de la trimitere »). Modifier l'une sans
 * l'autre reviendrait à mentir sur la page.
 */
const REPORT_RETENTION_MONTHS = 6;

/**
 * Purge OPPORTUNISTE, jamais planifiée. Un cron ou une tâche périodique
 * maintiendrait le compute Neon éveillé en permanence et épuiserait le
 * quota (100 CU-heures/mois) sans aucun trafic réel. La purge ne s'exécute
 * donc que sur deux chemins, rares et qui parlent déjà à la base :
 * le chargement de /admin et la création d'un signalement. JAMAIS sur un
 * chemin public en lecture.
 *
 * Une seule requête DELETE, portée par l'index existant sur createdAt.
 * setMonth gère le passage d'année ; sur un jour sans équivalent six mois
 * plus tôt (le 31), la date déborde sur le mois suivant, donc on garde
 * quelques jours de trop plutôt que de supprimer trop tôt.
 *
 * Un échec ne casse jamais l'appelant : la purge réessaiera au prochain
 * passage. Mais on veut le savoir — la durée annoncée est une promesse
 * publique — d'où reportError plutôt qu'un simple log.
 */
export async function purgeExpiredReports(): Promise<void> {
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - REPORT_RETENTION_MONTHS);

  try {
    const { count } = await prisma.report.deleteMany({
      where: { createdAt: { lt: cutoff } },
    });
    if (count > 0) {
      logInfo("report.purged", { count });
    }
  } catch (error) {
    await reportError("report.purge_failed", error);
  }
}
