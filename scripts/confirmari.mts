/**
 * Confirmation des annonces (lib/confirmations.ts) vue depuis un terminal.
 * Rien n'est envoyé ni écrit en base, jamais : toutes les requêtes passent
 * par une transaction READ ONLY vérifiée auprès de Postgres.
 *
 *   npm run confirmari                    mode à blanc : qui recevrait quoi
 *                                         si la tâche tournait maintenant,
 *                                         et l'étalement à 60 emails par jour
 *   npm run confirmari -- bilant          les chiffres depuis le début :
 *                                         emails, confirmations, adoptions,
 *                                         réponses, annonces masquées
 *   npm run confirmari -- apercu          l'email rendu en HTML, sur des
 *                                         animaux de la dev (jamais de la
 *                                         production : ses liens seraient
 *                                         de vrais liens signés)
 *
 *   … -- --productie                      sur la production (sauf apercu)
 *
 * Base : DATABASE_URL de .env.local (branche dev), ou
 * PRODUCTION_DATABASE_URL avec --productie. Aucune valeur de .env.local
 * n'est affichée, pas même l'hôte : seulement le nom de la variable.
 *
 * Le terminal ne reçoit que des nombres. Les noms et adresses des
 * publiants vont dans un fichier local, confirmari-export/ (hors git).
 */

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { parseEnv } from "node:util";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient, type Prisma } from "../src/generated/prisma/client";
import { animalDisplayName } from "../src/lib/animal-display";
import {
  DAILY_EMAIL_CAP,
  findDue,
  planDay,
  type DueAnimal,
  type PlannedEmail,
} from "../src/lib/confirmations";
import { countyName } from "../src/lib/counties";
import { STR } from "../src/lib/strings";

type Db = Prisma.TransactionClient;

const PRODUCTION_FLAG = "--productie";
const OUT_DIR = "confirmari-export";
const DAY_MS = 86_400_000;

const argv = process.argv.slice(2);
const unknown = argv.find((a) => a.startsWith("-") && a !== PRODUCTION_FLAG);
if (unknown) {
  console.error(`Option inconnue : ${unknown}. Seule option : ${PRODUCTION_FLAG}.`);
  process.exit(1);
}
const production = argv.includes(PRODUCTION_FLAG);
const command = argv.find((a) => !a.startsWith("-")) ?? "a-blanc";
if (!["a-blanc", "bilant", "apercu"].includes(command)) {
  console.error("Usage : npm run confirmari -- [a-blanc|bilant|apercu] [--productie]");
  process.exit(1);
}
if (command === "apercu" && production) {
  console.error("apercu ne tourne que sur la dev : sur la production, ses liens seraient de vrais liens signés.");
  process.exit(1);
}

let env: Record<string, string | undefined>;
try {
  env = parseEnv(readFileSync(".env.local", "utf8")) as Record<string, string | undefined>;
} catch {
  console.error("Impossible de lire .env.local — lancer depuis la racine du repo.");
  process.exit(1);
}
const variable = production ? "PRODUCTION_DATABASE_URL" : "DATABASE_URL";
const url = env[variable]?.trim();
if (!url) {
  console.error(`${variable} absente ou vide dans .env.local.`);
  process.exit(1);
}
/** Endpoint sans « -pooler » : sert à comparer, jamais à afficher. */
function endpoint(value: string | undefined): string | null {
  try {
    return value ? new URL(value).hostname.replace(/-pooler(?=\.)/, "") : null;
  } catch {
    return null;
  }
}
if (endpoint(env.DATABASE_URL) && endpoint(env.DATABASE_URL) === endpoint(env.PRODUCTION_DATABASE_URL)) {
  console.error("DATABASE_URL et PRODUCTION_DATABASE_URL visent la même branche : corriger .env.local.");
  process.exit(1);
}

const RULE = "═".repeat(72);
console.log(RULE);
console.log(production ? `BASE : PRODUCTION   (${variable})` : `BASE : DEV   (${variable} ; production : ${PRODUCTION_FLAG})`);

/** La seule porte vers la base : une transaction READ ONLY, vérifiée. */
async function withReadOnlyDb(fn: (db: Db) => Promise<void>): Promise<void> {
  const prisma = new PrismaClient({ adapter: new PrismaNeon({ connectionString: url! }) });
  try {
    await prisma.$transaction(
      async (tx) => {
        await tx.$executeRaw`SET TRANSACTION READ ONLY`;
        const [row] = await tx.$queryRaw<{ transaction_read_only: string }[]>`SHOW transaction_read_only`;
        if (row?.transaction_read_only !== "on") {
          throw new Error("La base n'a pas confirmé la lecture seule : arrêt avant toute lecture.");
        }
        console.log("Lecture seule confirmée par la base.");
        console.log(RULE);
        await fn(tx);
      },
      // Neon peut mettre quelques secondes à réveiller une branche endormie.
      { maxWait: 30_000, timeout: 120_000 },
    );
  } finally {
    await prisma.$disconnect();
  }
}

const STAGE_LABEL: Record<DueAnimal["stage"], string> = {
  first: "premier email",
  grouped: "jointe (14 j+)",
  reminder: "RELANCE",
  hide: "à masquer",
};

function ageDays(date: Date, now: Date): number {
  return Math.floor((now.getTime() - date.getTime()) / DAY_MS);
}

function place(a: { city: string | null; county: string }): string {
  return [a.city?.trim(), countyName(a.county)].filter(Boolean).join(", ");
}

function stamp(now: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Bucharest",
    dateStyle: "short",
    timeStyle: "short",
  }).format(now);
}

function fileDay(now: Date): string {
  return now.toISOString().slice(0, 10);
}

async function aBlanc(db: Db) {
  const now = new Date();
  const available = await db.animal.count({
    where: { status: "AVAILABLE", hidden: false, user: { suspended: false } },
  });
  const plan = planDay(await findDue(db, now));
  const asked = plan.emails.flatMap((e) => e.animals);
  const count = (stage: DueAnimal["stage"]) => asked.filter((a) => a.stage === stage).length;
  const days: number[] = [];
  plan.emails.forEach((_, i) => {
    const d = Math.floor(i / DAILY_EMAIL_CAP);
    days[d] = (days[d] ?? 0) + 1;
  });

  console.log(`Annonces disponibles (publiques, comptes actifs) : ${available}`);
  console.log(
    `Dans les emails : ${count("first")} premières demandes ` +
      `(dont ${asked.filter((a) => a.requested).length} signalées par un visiteur), ` +
      `${count("reminder")} relances, ${count("grouped")} jointes (14 jours et plus)`,
  );
  console.log(`À masquer à ce passage (fin de cycle) : ${plan.hides.length}`);
  const withoutButtons = plan.emails.filter((e) => !e.user.emailVerified).length;
  console.log(
    `Emails : ${plan.emails.length} publiants — ${plan.emails.length - withoutButtons} avec boutons, ` +
      `${withoutButtons} SANS boutons (adresse non confirmée : « Intră în cont ca să confirmi »), ` +
      `jusqu'à ${Math.max(0, ...plan.emails.map((e) => e.animals.length))} annonces dans un même email`,
  );
  console.log(
    `Étalement à ${DAILY_EMAIL_CAP} par jour : ` +
      (days.length === 0 ? "rien à envoyer" : days.map((n, i) => `jour ${i + 1} : ${n}`).join(", ")),
  );

  const lines: string[] = [
    `CONFIRMĂRI — mode à blanc — ${production ? "PRODUCTION" : "DEV"} — ${stamp(now)} (București)`,
    `Rien n'a été envoyé. Plafond : ${DAILY_EMAIL_CAP} emails par jour, dans l'ordre ci-dessous.`,
    "",
  ];
  plan.emails.forEach((email: PlannedEmail, i) => {
    lines.push(
      `Jour ${Math.floor(i / DAILY_EMAIL_CAP) + 1} — email ${i + 1}/${plan.emails.length}`,
      `  À : ${email.user.name} <${email.user.email}>`,
      email.user.emailVerified
        ? "  Email AVEC boutons (adresse confirmée)"
        : "  Email SANS boutons (adresse non confirmée) : « Intră în cont ca să confirmi »",
      `  Objet : ${STR.confirmari.email.subject(email.animals.length, email.reminder)}`,
      ...email.animals.map(
        (a) =>
          `  - ${animalDisplayName(a)} · ${place(a)} — ${STAGE_LABEL[a.stage]}` +
          `, mise à jour il y a ${ageDays(a.updatedAt, now)} j` +
          (a.requested ? ", signalée « deja adoptat » par un visiteur" : "") +
          `  [${a.id}]`,
      ),
      "",
    );
  });
  lines.push(`Masquées à ce passage (${plan.hides.length}) :`);
  for (const a of plan.hides) {
    lines.push(`  - ${animalDisplayName(a)} · ${place(a)}  [${a.id}]`);
  }

  mkdirSync(OUT_DIR, { recursive: true });
  const file = `${OUT_DIR}/a-blanc-${fileDay(now)}-${production ? "productie" : "dev"}.txt`;
  writeFileSync(file, `${lines.join("\n")}\n`);
  console.log(RULE);
  console.log(`Détail (noms et adresses) : ${file}`);
}

async function bilant(db: Db) {
  const [row] = await db.$queryRaw<Record<string, number>[]>`
    SELECT
      count(*) FILTER (WHERE "confirmSentAt" IS NOT NULL)::int AS asked,
      count(*) FILTER (WHERE "confirmReminderSentAt" IS NOT NULL)::int AS reminded,
      count(*) FILTER (WHERE "status" = 'AVAILABLE' AND "confirmSentAt" >= "updatedAt")::int AS pending,
      count(*) FILTER (WHERE "status" = 'AVAILABLE' AND "confirmSentAt" < "updatedAt")::int AS confirmed,
      count(*) FILTER (WHERE "status" = 'ADOPTED' AND "confirmSentAt" IS NOT NULL AND "confirmSentAt" < "updatedAt")::int AS adopted_after,
      count(*) FILTER (WHERE "status" = 'UNCONFIRMED')::int AS unconfirmed,
      count(*) FILTER (WHERE "status" = 'ADOPTED')::int AS adopted,
      count(*) FILTER (WHERE "status" = 'ADOPTED' AND "hidden" = false)::int AS adopted_public,
      count(*) FILTER (WHERE "status" = 'ADOPTED' AND "adoptionSource" = 'TAKEMEHOME')::int AS via_site,
      count(*) FILTER (WHERE "status" = 'ADOPTED' AND "adoptionSource" = 'ELSEWHERE')::int AS elsewhere,
      count(*) FILTER (WHERE "status" = 'ADOPTED' AND "adoptionSource" = 'UNKNOWN')::int AS unknown,
      count(*) FILTER (WHERE "confirmRequestedAt" IS NOT NULL)::int AS requested
    FROM "Animal"`;
  console.log(`Annonces qui ont reçu au moins un email : ${row.asked} (dont ${row.reminded} relancées)`);
  console.log(`  en attente de réponse : ${row.pending}`);
  console.log(`  remises à jour depuis (« Încă disponibil » ou modification) : ${row.confirmed}`);
  console.log(`  adoptées depuis l'email : ${row.adopted_after}`);
  console.log(`  masquées faute de réponse (UNCONFIRMED) : ${row.unconfirmed}`);
  console.log(`Adoptées au total : ${row.adopted} (sur /adoptati : ${row.adopted_public})`);
  console.log(
    `« L-a adoptat cineva care l-a găsit pe takemehome.ro? » (annonces adoptées) : ` +
      `Da ${row.via_site} · Nu ${row.elsewhere} · Nu știu ${row.unknown}`,
  );
  console.log(`Annonces signalées « A fost deja adoptat? » au moins une fois : ${row.requested}`);
}

async function apercu(db: Db) {
  // Les liens de l'aperçu sont signés avec la clé locale : il la faut dans
  // process.env (le script lit .env.local sans l'y verser).
  process.env.BETTER_AUTH_SECRET = env.BETTER_AUTH_SECRET;
  const { renderConfirmationEmail } = await import("../src/lib/confirmation-email");
  const now = new Date();
  // Les annonces avec photo d'abord : l'aperçu doit montrer les miniatures.
  const candidates = await db.animal.findMany({
    where: { status: "AVAILABLE", hidden: false },
    orderBy: { updatedAt: "asc" },
    take: 20,
    select: {
      id: true, name: true, type: true, count: true, ageGroup: true, city: true,
      county: true, updatedAt: true, confirmSentAt: true,
      photos: { orderBy: { position: "asc" }, take: 1, select: { url: true } },
    },
  });
  const rows = [
    ...candidates.filter((r) => r.photos.length > 0),
    ...candidates.filter((r) => r.photos.length === 0),
  ].slice(0, 3);
  if (rows.length === 0) {
    console.log("Aucune annonce disponible sur la dev : rien à rendre.");
    return;
  }
  // Une annonce par cas de figure : relance, demande d'un visiteur, premier email.
  const stages: [DueAnimal["stage"], boolean][] = [["reminder", false], ["first", true], ["first", false]];
  const email: PlannedEmail = {
    user: { id: "apercu", name: "Ana", email: "delivered@resend.dev", emailVerified: true },
    animals: rows.map((r, i) => ({
      ...r,
      photoUrl: r.photos[0]?.url ?? null,
      stage: stages[i][0],
      requested: stages[i][1],
    })),
    reminder: true,
    requested: true,
  };
  mkdirSync(OUT_DIR, { recursive: true });
  // Les deux variantes : avec boutons (adresse confirmée), sans boutons.
  for (const [verified, file] of [[true, "apercu"], [false, "apercu-sans-boutons"]] as const) {
    const { subject, text, html } = renderConfirmationEmail(
      { ...email, user: { ...email.user, emailVerified: verified } },
      now,
    );
    writeFileSync(`${OUT_DIR}/${file}.html`, html);
    writeFileSync(`${OUT_DIR}/${file}.txt`, `${subject}\n\n${text}\n`);
    console.log(`Aperçu : ${OUT_DIR}/${file}.html et ${OUT_DIR}/${file}.txt`);
  }
}

await withReadOnlyDb(command === "bilant" ? bilant : command === "apercu" ? apercu : aBlanc);
