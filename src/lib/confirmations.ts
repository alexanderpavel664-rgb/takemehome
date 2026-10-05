import { Prisma, type PrismaClient } from "@/generated/prisma/client";
import type { AgeGroup, AnimalType } from "@/generated/prisma/client";
import { EmailSendError } from "@/lib/email";

/**
 * Confirmation des annonces — octobre 2026.
 *
 * LE PRINCIPE. Une annonce ne reste disponible que tant que quelqu'un
 * confirme qu'elle l'est : le silence suffit à la retirer. Rien ici ne
 * dépend d'un retour du publiant sur le site.
 *
 *   J0   aucune mise à jour depuis 21 jours → email (confirmSentAt)
 *   J14  pas de réponse → relance (confirmReminderSentAt)
 *   J28  toujours rien → statut UNCONFIRMED : l'annonce sort des listes,
 *        la fiche affiche un message neutre, /cont propose de la réactiver
 *
 * LE CYCLE est en cours tant que confirmSentAt >= updatedAt. Toute écriture
 * du publiant passe par Prisma Client, qui avance updatedAt (@updatedAt) :
 * modifier l'annonce, changer son statut, cliquer « Încă disponibil »
 * clôt le cycle d'elle-même. Le système, lui, écrit en SQL brut, qui ne
 * touche pas updatedAt : envoyer un email ne fait ni remonter l'annonce
 * dans les listes, ni repartir le compteur.
 *
 * « A FOST DEJA ADOPTAT? » sur la fiche pose confirmRequestedAt : tant qu'il
 * est postérieur à updatedAt et qu'aucun cycle ne court, l'annonce est due
 * dès la tâche suivante, sans attendre 21 jours. Pendant un cycle, la
 * demande ne déclenche rien de plus (l'email est déjà parti) mais la
 * relance la mentionne.
 *
 * UN EMAIL PAR PUBLIANT. Quand un publiant reçoit un email, ses autres
 * annonces sans mise à jour depuis 14 jours y entrent aussi (« grouped ») :
 * sans cela, celui qui publie dix animaux sur un mois recevrait dix emails
 * à dix dates. Elles commencent alors leur cycle quelques jours plus tôt.
 *
 * LA TÂCHE tourne une fois par jour (Vercel Cron, forfait Hobby : une
 * exécution quotidienne au plus, à une minute quelconque de l'heure
 * prévue — d'où SLACK_MS). Vercel peut sauter une exécution ou la lancer
 * deux fois : chaque passage recalcule tout depuis la base, un passage
 * manqué est rattrapé le lendemain, et un double envoi est arrêté par la
 * clé d'idempotence de Resend (un email par publiant et par jour).
 */

export const FIRST_EMAIL_AFTER_DAYS = 21;
export const REMINDER_AFTER_DAYS = 14;
export const HIDE_AFTER_DAYS = 14;
/** Annonces sans mise à jour depuis 14 jours : jointes à l'email du publiant. */
export const GROUP_WITH_DAYS = 14;
/** « A fost deja adoptat? » : au plus une demande par annonce tous les 7 jours. */
export const REQUEST_THROTTLE_DAYS = 7;
/**
 * Forfait Resend Free : 100 emails par jour, tous envois confondus. 60 pour
 * cette tâche, 40 gardés pour les emails de compte (confirmation d'adresse,
 * mot de passe oublié). Les publiants au-delà passent au lendemain.
 */
export const DAILY_EMAIL_CAP = 60;

const DAY_MS = 86_400_000;
// La tâche part à une minute quelconque de l'heure prévue : sans marge, un
// email envoyé à 10 h 45 ne serait relancé qu'au 15ᵉ jour si la tâche du
// 14ᵉ part à 10 h 05.
const SLACK_MS = 2 * 3_600_000;

type Db = PrismaClient | Prisma.TransactionClient;

export type Stage = "first" | "grouped" | "reminder" | "hide";

export type DueAnimal = {
  id: string;
  name: string | null;
  type: AnimalType;
  count: number;
  ageGroup: AgeGroup | null;
  city: string | null;
  county: string;
  updatedAt: Date;
  confirmSentAt: Date | null;
  photoUrl: string | null;
  stage: Stage;
  /** Un visiteur a cliqué « A fost deja adoptat? » depuis la dernière mise à jour. */
  requested: boolean;
};

export type Recipient = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
};

export type PlannedEmail = {
  user: Recipient;
  animals: DueAnimal[];
  /** Au moins une relance dans l'email. */
  reminder: boolean;
  /** Au moins une annonce signalée « deja adoptat » par un visiteur. */
  requested: boolean;
};

export type DayPlan = {
  hides: DueAnimal[];
  /** Par ordre de priorité : la tâche envoie les DAILY_EMAIL_CAP premiers. */
  emails: PlannedEmail[];
};

function before(now: Date, days: number): number {
  return now.getTime() - days * DAY_MS + SLACK_MS;
}

type AnimalState = {
  updatedAt: Date;
  confirmSentAt: Date | null;
  confirmReminderSentAt: Date | null;
  confirmRequestedAt: Date | null;
};

export function isRequested(animal: AnimalState): boolean {
  return (
    animal.confirmRequestedAt !== null &&
    animal.confirmRequestedAt > animal.updatedAt
  );
}

/** L'étape due aujourd'hui pour une annonce AVAILABLE, ou null. */
export function stageOf(animal: AnimalState, now: Date): Stage | null {
  const { updatedAt, confirmSentAt, confirmReminderSentAt } = animal;
  if (confirmSentAt && confirmSentAt >= updatedAt) {
    // Relance de CE cycle : une relance d'un cycle précédent est antérieure
    // au premier email de celui-ci.
    if (confirmReminderSentAt && confirmReminderSentAt >= confirmSentAt) {
      return confirmReminderSentAt.getTime() <= before(now, HIDE_AFTER_DAYS)
        ? "hide"
        : null;
    }
    return confirmSentAt.getTime() <= before(now, REMINDER_AFTER_DAYS)
      ? "reminder"
      : null;
  }
  if (updatedAt.getTime() <= before(now, FIRST_EMAIL_AFTER_DAYS)) {
    return "first";
  }
  if (isRequested(animal)) {
    return "first";
  }
  if (updatedAt.getTime() <= before(now, GROUP_WITH_DAYS)) {
    return "grouped";
  }
  return null;
}

/**
 * Toutes les annonces qui ont une étape due. Les annonces masquées par la
 * modération et celles des comptes suspendus n'entrent jamais dans le
 * cycle : on ne demande pas de confirmer ce que le publiant ne peut plus
 * modifier, ni ce que personne ne voit.
 *
 * Toutes les annonces disponibles sont lues (quelques centaines) et l'étape
 * est calculée ici plutôt qu'en SQL : la règle se lit en une fonction.
 */
export async function findDue(
  db: Db,
  now: Date,
): Promise<{ animal: DueAnimal; user: Recipient }[]> {
  const rows = await db.animal.findMany({
    where: { status: "AVAILABLE", hidden: false, user: { suspended: false } },
    select: {
      id: true,
      name: true,
      type: true,
      count: true,
      ageGroup: true,
      city: true,
      county: true,
      updatedAt: true,
      confirmSentAt: true,
      confirmReminderSentAt: true,
      confirmRequestedAt: true,
      photos: { orderBy: { position: "asc" }, take: 1, select: { url: true } },
      user: {
        select: { id: true, name: true, email: true, emailVerified: true },
      },
    },
  });
  return rows.flatMap((row) => {
    const stage = stageOf(row, now);
    if (!stage) {
      return [];
    }
    return [
      {
        user: row.user,
        animal: {
          id: row.id,
          name: row.name,
          type: row.type,
          count: row.count,
          ageGroup: row.ageGroup,
          city: row.city,
          county: row.county,
          updatedAt: row.updatedAt,
          confirmSentAt: row.confirmSentAt,
          photoUrl: row.photos[0]?.url ?? null,
          stage,
          requested: isRequested(row),
        },
      },
    ];
  });
}

const STAGE_ORDER: Record<Stage, number> = {
  reminder: 0,
  first: 1,
  grouped: 2,
  hide: 3,
};

/**
 * Regroupe par publiant et ordonne. Un email ne part que s'il contient au
 * moins une annonce due (« first » ou « reminder ») : les « grouped »
 * l'accompagnent, ils ne le déclenchent pas.
 *
 * Priorité, quand le plafond du jour coupe la liste : les relances d'abord
 * (leur délai court déjà), puis les demandes de visiteurs, puis les
 * annonces les plus anciennes.
 */
export function planDay(due: { animal: DueAnimal; user: Recipient }[]): DayPlan {
  const hides: DueAnimal[] = [];
  const byUser = new Map<string, PlannedEmail>();
  for (const { animal, user } of due) {
    if (animal.stage === "hide") {
      hides.push(animal);
      continue;
    }
    const email = byUser.get(user.id) ?? {
      user,
      animals: [],
      reminder: false,
      requested: false,
    };
    email.animals.push(animal);
    byUser.set(user.id, email);
  }

  const emails = [...byUser.values()].filter((email) =>
    email.animals.some((a) => a.stage === "first" || a.stage === "reminder"),
  );
  for (const email of emails) {
    email.animals.sort(
      (a, b) =>
        STAGE_ORDER[a.stage] - STAGE_ORDER[b.stage] ||
        a.updatedAt.getTime() - b.updatedAt.getTime(),
    );
    email.reminder = email.animals.some((a) => a.stage === "reminder");
    email.requested = email.animals.some((a) => a.requested);
  }

  const rank = (email: PlannedEmail) =>
    email.reminder ? 0 : email.requested ? 1 : 2;
  // La date qui compte : le premier envoi pour une relance, la dernière
  // mise à jour sinon — la plus ancienne passe devant.
  const since = (email: PlannedEmail) =>
    Math.min(
      ...email.animals
        .filter((a) => a.stage !== "grouped")
        .map((a) =>
          (a.stage === "reminder" && a.confirmSentAt
            ? a.confirmSentAt
            : a.updatedAt
          ).getTime(),
        ),
    );
  emails.sort((a, b) => rank(a) - rank(b) || since(a) - since(b));

  return { hides, emails };
}

/** Une date JS comme horodatage UTC sans fuseau — le type des colonnes Prisma. */
function utc(date: Date): Prisma.Sql {
  return Prisma.sql`(${date.toISOString()}::timestamptz AT TIME ZONE 'UTC')`;
}

/**
 * Masque les annonces arrivées au bout du cycle. La condition du cycle est
 * reprise dans le WHERE : une annonce confirmée entre la lecture et
 * l'écriture n'est pas masquée. `hidden` n'est jamais touché : c'est la
 * colonne de la modération.
 */
export async function hideUnconfirmed(db: Db, ids: string[]): Promise<number> {
  if (ids.length === 0) {
    return 0;
  }
  return db.$executeRaw`
    UPDATE "Animal" SET "status" = 'UNCONFIRMED'
    WHERE "id" IN (${Prisma.join(ids)})
      AND "status" = 'AVAILABLE'
      AND "confirmSentAt" >= "updatedAt"`;
}

/** Note l'envoi : premier email ou relance selon l'étape de chaque annonce. */
export async function markSent(
  db: Db,
  email: PlannedEmail,
  now: Date,
): Promise<void> {
  const first = email.animals
    .filter((a) => a.stage !== "reminder")
    .map((a) => a.id);
  const reminder = email.animals
    .filter((a) => a.stage === "reminder")
    .map((a) => a.id);
  if (first.length > 0) {
    await db.$executeRaw`
      UPDATE "Animal" SET "confirmSentAt" = ${utc(now)}
      WHERE "id" IN (${Prisma.join(first)})`;
  }
  if (reminder.length > 0) {
    await db.$executeRaw`
      UPDATE "Animal" SET "confirmReminderSentAt" = ${utc(now)}
      WHERE "id" IN (${Prisma.join(reminder)})`;
  }
}

/** Le jour civil à București, « 2026-10-05 » : la clé d'idempotence du jour. */
export function bucharestDay(now: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Bucharest",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** Date à laquelle une annonce relancée aujourd'hui sera masquée sans réponse. */
export function hideDateAfterReminder(now: Date): Date {
  return new Date(now.getTime() + HIDE_AFTER_DAYS * DAY_MS);
}

/**
 * Cycle en cours : la date à laquelle l'annonce sera masquée sans réponse
 * (relance prévue comprise) ; null hors cycle. Pour /cont.
 */
export function pendingHideDate(
  animal: Pick<AnimalState, "updatedAt" | "confirmSentAt" | "confirmReminderSentAt">,
): Date | null {
  const { updatedAt, confirmSentAt, confirmReminderSentAt } = animal;
  if (!confirmSentAt || confirmSentAt < updatedAt) {
    return null;
  }
  if (confirmReminderSentAt && confirmReminderSentAt >= confirmSentAt) {
    return new Date(confirmReminderSentAt.getTime() + HIDE_AFTER_DAYS * DAY_MS);
  }
  return new Date(
    confirmSentAt.getTime() + (REMINDER_AFTER_DAYS + HIDE_AFTER_DAYS) * DAY_MS,
  );
}

/** « 2 noiembrie » — le jour civil à București. */
export function longDateRo(date: Date): string {
  return new Intl.DateTimeFormat("ro", {
    day: "numeric",
    month: "long",
    timeZone: "Europe/Bucharest",
  }).format(date);
}

export type RunSummary = {
  hidden: number;
  emailsSent: number;
  animalsAsked: number;
  /** Au-delà du plafond du jour ou du quota Resend : repris demain. */
  deferred: number;
  /** Clé d'idempotence déjà utilisée (double déclenchement) : rien d'envoyé. */
  skipped: number;
  /** Adresse refusée par Resend (422) : le cycle avance quand même. */
  undeliverable: number;
  failed: number;
};

/**
 * Le passage quotidien. `send` et `onFailure` sont injectés : la route y
 * branche Resend et Sentry, un essai y branche des bouchons.
 */
export async function runConfirmations({
  db,
  now,
  send,
  onFailure,
  cap = DAILY_EMAIL_CAP,
}: {
  db: Db;
  now: Date;
  send: (email: PlannedEmail) => Promise<void>;
  onFailure: (error: unknown, email: PlannedEmail) => Promise<void>;
  cap?: number;
}): Promise<RunSummary> {
  const plan = planDay(await findDue(db, now));
  const summary: RunSummary = {
    hidden: await hideUnconfirmed(
      db,
      plan.hides.map((a) => a.id),
    ),
    emailsSent: 0,
    animalsAsked: 0,
    deferred: 0,
    skipped: 0,
    undeliverable: 0,
    failed: 0,
  };

  let quotaReached = false;
  for (const email of plan.emails) {
    if (quotaReached || summary.emailsSent >= cap) {
      summary.deferred += 1;
      continue;
    }
    try {
      await send(email);
    } catch (error) {
      if (error instanceof EmailSendError && error.status === 429) {
        // Quota du jour épuisé (ou débit) : on s'arrête, la suite demain.
        quotaReached = true;
        summary.deferred += 1;
        continue;
      }
      if (error instanceof EmailSendError && error.status === 409) {
        // Même clé d'idempotence déjà utilisée aujourd'hui : un autre
        // passage s'en est chargé, ou s'en charge en ce moment.
        summary.skipped += 1;
        continue;
      }
      if (error instanceof EmailSendError && error.status === 422) {
        // Adresse refusée : le publiant est injoignable, ce qui revient au
        // silence. Le cycle avance comme si l'email était parti, et
        // l'annonce sera masquée à son terme — c'est le but.
        await markSent(db, email, now);
        summary.undeliverable += 1;
        await onFailure(error, email);
        continue;
      }
      // Panne (réseau, 5xx…) : rien n'est noté, l'email repart demain.
      summary.failed += 1;
      await onFailure(error, email);
      continue;
    }
    await markSent(db, email, now);
    summary.emailsSent += 1;
    summary.animalsAsked += email.animals.length;
  }
  return summary;
}
