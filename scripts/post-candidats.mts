/**
 * Candidats à publier sur les réseaux sociaux — 5 animaux AVAILABLE.
 *
 *   npm run post:candidats                    liste 5 candidats
 *   npm run post:candidats -- publie <id…>    marque un ou plusieurs animaux
 *                                             comme publiés (ils ne
 *                                             ressortiront plus)
 *   npm run post:candidats -- liste           affiche ce qui a déjà été publié
 *
 *   … -- --productie                          sur la production plutôt que la
 *                                             dev (accepté par toutes les
 *                                             commandes, n'importe où)
 *
 * Base : DATABASE_URL de .env.local (la branche dev, animaux de test), ou
 * PRODUCTION_DATABASE_URL avec --productie. La base visée et son nombre
 * d'annonces s'affichent en tête de sortie.
 *
 * Critères, dans l'ordre :
 *   1. exclus : déjà publiés (trace locale dans social-export/publicate.json,
 *      jamais en base) ;
 *   2. exclus : publiant sans contact affichable — exactement la règle de la
 *      fiche publique (lib/contact-status.ts), plus compte suspendu et
 *      annonce masquée, qui n'ont pas de fiche publique du tout ;
 *   3. privilégiés : avec photo ;
 *   4. fortement pénalisés : description de moins de 150 caractères (rien à
 *      raconter) — tirés seulement s'il n'y a pas assez d'autres candidats ;
 *   5. privilégiés : publiés depuis longtemps ;
 *   6. légèrement privilégiés : plusieurs photos ;
 *   7. privilégiés : județe prioritaires, ceux où un groupe Facebook
 *      d'adoption a été repéré — liste tenue à la main dans
 *      social-export/judete-prioritare.json, tableau JSON de codes ou de
 *      noms : ["CJ", "Iași"], ou [] ;
 *   8. variés : județe et types différents dans le tirage, et différents des
 *      derniers tirages et des dernières publications.
 *
 * Lecture seule sur la base, imposée par Postgres lui-même : toutes les
 * requêtes passent par une transaction READ ONLY vérifiée (withReadOnlyDb).
 * Le seul fichier écrit est la trace locale.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { parseEnv } from "node:util";
import { PrismaClient, type Prisma } from "../src/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { animalDisplayName } from "../src/lib/animal-display";
import { contactStatus } from "../src/lib/contact-status";
import { COUNTIES } from "../src/lib/counties";
import { AGE_GROUP_LABELS, SEX_LABELS, TYPE_LABELS } from "../src/lib/animal-labels";
import { SITE_URL } from "../src/lib/site";

// SITE_URL (lib/site.ts) lit NEXT_PUBLIC_SITE_URL au chargement du module :
// en local, cette variable est absente et SITE_URL retombe sur l'URL
// Vercel — bonne pour la dev, fausse pour des liens qu'on va publier. En
// --productie les URL affichées doivent pointer sur le vrai domaine, quelle
// que soit la variable locale.
const PRODUCTION_SITE_URL = "https://takemehome.ro";

const TRACE_FILE = "social-export/publicate.json";
const PRIORITY_FILE = "social-export/judete-prioritare.json";
const SHORT_DESCRIPTION = 150;
const CANDIDATES = 5;
const REMEMBERED_DRAWS = 3;

// ——— Trace locale ———————————————————————————————————————————————————

type Trace = {
  /** Animaux déjà publiés sur les réseaux. */
  publicate: { id: string; name: string; county: string; type: string; at: string }[];
  /** Derniers tirages, pour varier d'une fois sur l'autre. */
  trageri: { at: string; ids: string[]; counties: string[]; types: string[] }[];
};

function readTrace(): Trace {
  if (!existsSync(TRACE_FILE)) return { publicate: [], trageri: [] };
  const raw = JSON.parse(readFileSync(TRACE_FILE, "utf8")) as Partial<Trace>;
  return { publicate: raw.publicate ?? [], trageri: raw.trageri ?? [] };
}

function writeTrace(trace: Trace) {
  mkdirSync("social-export", { recursive: true });
  writeFileSync(TRACE_FILE, JSON.stringify(trace, null, 2) + "\n");
}

// ——— Județe prioritaires ———————————————————————————————————————————————

// Fichier édité à la main : une faute de frappe ne doit pas faire perdre
// le bonus sans bruit, donc toute entrée non reconnue arrête le script.
function readPriorityCounties(): Set<string> {
  if (!existsSync(PRIORITY_FILE)) return new Set();
  const text = readFileSync(PRIORITY_FILE, "utf8");
  if (text.trim() === "") return new Set();
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch (e) {
    console.error(`${PRIORITY_FILE} : JSON invalide — ${(e as Error).message}`);
    process.exit(1);
  }
  if (!Array.isArray(raw)) {
    console.error(`${PRIORITY_FILE} : attendu un tableau, par exemple ["CJ", "Iași"].`);
    process.exit(1);
  }
  const codes = new Set<string>();
  const unknown: unknown[] = [];
  for (const entry of raw) {
    const county = typeof entry === "string" ? findCounty(entry) : undefined;
    if (county) codes.add(county.code);
    else unknown.push(entry);
  }
  if (unknown.length > 0) {
    console.error(
      `${PRIORITY_FILE} : județ inconnu — ${unknown.map((u) => JSON.stringify(u)).join(", ")}.`,
    );
    console.error(`Codes acceptés : ${COUNTIES.map((c) => c.code).join(", ")} (ou le nom).`);
    process.exit(1);
  }
  return codes;
}

/** Code ou nom, casse et diacritiques ignorées : « cj », « Iasi », « Iași ». */
function findCounty(entry: string) {
  const fold = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").trim().toLowerCase();
  const key = fold(entry);
  return COUNTIES.find((c) => fold(c.code) === key || fold(c.name) === key);
}

// ——— Base ————————————————————————————————————————————————————————————

const PRODUCTION_FLAG = "--productie";

type Target = { production: boolean; variable: string; url: string };
type Db = Prisma.TransactionClient;

// .env.local fait foi, et lui seul (même raison que seed-demo.mts : un
// DATABASE_URL resté dans le shell viserait silencieusement une autre base).
function resolveTarget(production: boolean): Target {
  let env: Record<string, string | undefined>;
  try {
    env = parseEnv(readFileSync(".env.local", "utf8")) as Record<string, string | undefined>;
  } catch {
    console.error("Impossible de lire .env.local — lancer depuis la racine du repo.");
    process.exit(1);
  }
  const variable = production ? "PRODUCTION_DATABASE_URL" : "DATABASE_URL";
  const url = env[variable];
  if (!url) {
    console.error(`${variable} absente de .env.local.`);
    process.exit(1);
  }
  // Les deux variables sur la même base : l'étiquette DEV/PRODUCTION
  // mentirait, donc on refuse plutôt que d'afficher une fausse cible.
  const dev = env.DATABASE_URL;
  const prod = env.PRODUCTION_DATABASE_URL;
  if (dev && prod && databaseKey(dev) === databaseKey(prod)) {
    console.error(
      `DATABASE_URL et PRODUCTION_DATABASE_URL visent la même base (${hostLabel(dev)}) : ` +
        `corriger .env.local.`,
    );
    process.exit(1);
  }
  return { production, variable, url };
}

/** Endpoint sans « -pooler » + nom de base : les deux chaînes Neon d'une même branche se valent. */
function databaseKey(url: string): string {
  try {
    const u = new URL(url);
    return `${u.hostname.replace(/-pooler(?=\.)/, "")}/${u.pathname.slice(1)}`;
  } catch {
    return url;
  }
}

/** Hôte et base, jamais les identifiants. */
function hostLabel(url: string): string {
  try {
    const u = new URL(url);
    return `${u.hostname} / ${u.pathname.slice(1)}`;
  } catch {
    return "(URL illisible)";
  }
}

/**
 * Seule porte vers la base : le client Prisma ne sort pas d'ici, et tout
 * passe par une transaction mise en READ ONLY avant la première requête,
 * puis vérifiée auprès de Postgres. Une écriture ajoutée un jour par
 * erreur serait refusée par la base elle-même (« cannot execute UPDATE in
 * a read-only transaction »), en production comme en dev.
 */
async function withReadOnlyDb(target: Target, fn: (db: Db) => Promise<void>): Promise<void> {
  const prisma = new PrismaClient({
    adapter: new PrismaNeon({ connectionString: target.url }),
  });
  try {
    await prisma.$transaction(
      async (tx) => {
        await tx.$executeRaw`SET TRANSACTION READ ONLY`;
        const [row] = await tx.$queryRaw<{ transaction_read_only: string }[]>`SHOW transaction_read_only`;
        if (row?.transaction_read_only !== "on") {
          throw new Error(
            `La base n'a pas confirmé la lecture seule (transaction_read_only = ` +
              `${row?.transaction_read_only ?? "?"}) : arrêt avant toute lecture.`,
          );
        }
        await fn(tx);
      },
      // Neon peut mettre quelques secondes à réveiller une branche endormie.
      { maxWait: 30_000, timeout: 120_000 },
    );
  } finally {
    await prisma.$disconnect();
  }
}

// ——— Bandeau de tête ——————————————————————————————————————————————————

const RULE = "═".repeat(72);

// Affiché AVANT la connexion : la cible se lit même si la base tarde.
function printTarget(target: Target) {
  console.log(RULE);
  console.log(
    target.production
      ? `BASE : PRODUCTION   (PRODUCTION_DATABASE_URL, ${PRODUCTION_FLAG})`
      : `BASE : DEV — animaux de test   (DATABASE_URL ; vrais animaux : ${PRODUCTION_FLAG})`,
  );
  console.log(`Hôte : ${hostLabel(target.url)}`);
}

async function printCensus(db: Db) {
  const total = await db.animal.count();
  const available = await db.animal.count({ where: { status: "AVAILABLE" } });
  console.log(
    `Trouvé : ${total} annonce${total > 1 ? "s" : ""} en base, dont ${available} ` +
      `disponible${available > 1 ? "s" : ""} — lecture seule confirmée par la base`,
  );
  console.log(RULE);
  console.log();
}

// ——— Diacritiques ————————————————————————————————————————————————————

// ş (U+015F) / ţ (U+0163) à cédille, et leurs majuscules, au lieu des
// virgules souscrites ș (U+0219) / ț (U+021B).
const CEDILLA = /[şţŞŢ]/;

function cedillaWords(text: string | null | undefined): string[] {
  if (!text) return [];
  return [...new Set(text.split(/\s+/).filter((w) => CEDILLA.test(w)))];
}

// ——— Sélection ———————————————————————————————————————————————————————

const DAY = 86_400_000;

async function main() {
  const argv = process.argv.slice(2);
  // Une faute de frappe (--production, --prod) ne doit pas retomber en
  // silence sur la dev.
  const unknownOption = argv.find((a) => a.startsWith("-") && a !== PRODUCTION_FLAG);
  if (unknownOption) {
    console.error(`Option inconnue : ${unknownOption}. Seule option : ${PRODUCTION_FLAG}.`);
    process.exit(1);
  }
  const production = argv.includes(PRODUCTION_FLAG);
  const [command, ...args] = argv.filter((a) => a !== PRODUCTION_FLAG);
  const trace = readTrace();

  if (command === "liste") {
    if (trace.publicate.length === 0) {
      console.log("Aucun animal publié pour l'instant.");
      return;
    }
    for (const p of trace.publicate) {
      console.log(`${p.at.slice(0, 10)}  ${p.id}  ${p.name} (${TYPE_LABELS[p.type as keyof typeof TYPE_LABELS] ?? p.type}, ${countyName(p.county)})`);
    }
    return;
  }

  // Tout ce qui peut échouer sans la base est vérifié avant de s'y connecter.
  if (command !== undefined && command !== "publie") {
    console.error(`Commande inconnue : ${command}. Commandes : (aucune), publie, liste.`);
    process.exit(1);
  }
  if (command === "publie" && args.length === 0) {
    console.error(`Usage : npm run post:candidats -- publie <id> [id…] [${PRODUCTION_FLAG}]`);
    process.exit(1);
  }
  const priorityCounties = command === undefined ? readPriorityCounties() : new Set<string>();

  const target = resolveTarget(production);
  printTarget(target);

  await withReadOnlyDb(target, async (db) => {
    await printCensus(db);

    if (command === "publie") {
      const animals = await db.animal.findMany({
        where: { id: { in: args } },
        select: { id: true, name: true, county: true, type: true, count: true },
      });
      const now = new Date().toISOString();
      for (const id of args) {
        const a = animals.find((x) => x.id === id);
        if (!a) {
          console.error(`Inconnu en base : ${id}`);
          continue;
        }
        const name = animalDisplayName(a);
        if (trace.publicate.some((p) => p.id === id)) {
          console.log(`Déjà marqué : ${name} (${id})`);
          continue;
        }
        trace.publicate.push({ id, name, county: a.county, type: a.type, at: now });
        console.log(`Marqué publié : ${name} (${id})`);
      }
      writeTrace(trace);
      return;
    }

    const publishedIds = new Set(trace.publicate.map((p) => p.id));

    const animals = await db.animal.findMany({
      where: {
        status: "AVAILABLE",
        hidden: false,
        id: { notIn: [...publishedIds] },
        user: { suspended: false },
      },
      select: {
        id: true,
        name: true,
        type: true,
        sex: true,
        ageGroup: true,
        ageText: true,
        count: true,
        city: true,
        county: true,
        description: true,
        createdAt: true,
        user: { select: { phone: true, publicEmail: true, contactConsent: true } },
        _count: { select: { photos: true } },
      },
    });

    const now = Date.now();
    const pool = animals
      .filter((a) => contactStatus(a.user).contactable)
      .map((a) => ({
        ...a,
        days: Math.floor((now - a.createdAt.getTime()) / DAY),
        photoCount: a._count.photos,
        hasPhoto: a._count.photos > 0,
        descriptionLength: [...(a.description?.trim() ?? "")].length,
        priority: priorityCounties.has(a.county),
      }));

    if (pool.length === 0) {
      console.log("Aucun candidat : tout est publié, ou personne n'a de contact affichable.");
      return;
    }

    // Ce qu'on a montré ou publié récemment, pour varier.
    const recentCounties = new Map<string, number>();
    const recentTypes = new Map<string, number>();
    const bump = (m: Map<string, number>, k: string) => m.set(k, (m.get(k) ?? 0) + 1);
    for (const d of trace.trageri.slice(-REMEMBERED_DRAWS)) {
      d.counties.forEach((c) => bump(recentCounties, c));
      d.types.forEach((t) => bump(recentTypes, t));
    }
    for (const p of trace.publicate.slice(-CANDIDATES)) {
      bump(recentCounties, p.county);
      bump(recentTypes, p.type);
    }

    // Sélection gloutonne, score en « jours équivalents » :
    //   - photo : +10 000, pèse plus que tout (un post sans image ne
    //     marche pas) ;
    //   - description courte : −5 000, un palier sous toutes les
    //     descriptions suffisantes à photo égale — elle ne sort que s'il
    //     n'y a pas assez d'autres candidats ;
    //   - ancienneté en jours ;
    //   - photos en plus de la première : +10 chacune, 3 au plus ;
    //   - județ prioritaire : +50 ;
    //   - pénalités quand un județ/type est déjà dans la sélection ou
    //     dans les tirages récents.
    const selected: typeof pool = [];
    const remaining = [...pool];
    while (selected.length < CANDIDATES && remaining.length > 0) {
      let best = -1;
      let bestScore = -Infinity;
      remaining.forEach((a, i) => {
        const sameCounty = selected.filter((s) => s.county === a.county).length;
        const sameType = selected.filter((s) => s.type === a.type).length;
        const score =
          (a.hasPhoto ? 10_000 : 0) -
          (a.descriptionLength < SHORT_DESCRIPTION ? 5_000 : 0) +
          a.days +
          10 * Math.min(Math.max(a.photoCount - 1, 0), 3) +
          (a.priority ? 50 : 0) -
          40 * sameCounty -
          25 * sameType -
          20 * (recentCounties.get(a.county) ?? 0) -
          10 * (recentTypes.get(a.type) ?? 0);
        if (score > bestScore) {
          bestScore = score;
          best = i;
        }
      });
      selected.push(remaining.splice(best, 1)[0]);
    }

    // ——— Affichage ———
    const line = "─".repeat(72);
    console.log(
      `${pool.length} animaux éligibles (${animals.length} disponibles non publiés, ` +
        `${animals.length - pool.length} sans contact affichable), ` +
        `${publishedIds.size} déjà publiés.`,
    );
    console.log(
      `Județe prioritaires : ${
        priorityCounties.size === 0
          ? `aucun (${PRIORITY_FILE})`
          : [...priorityCounties].map(countyName).join(", ")
      }\n`,
    );
    const siteUrl = target.production ? PRODUCTION_SITE_URL : SITE_URL;
    selected.forEach((a, i) => {
      const age = a.ageText?.trim() || (a.ageGroup ? AGE_GROUP_LABELS[a.ageGroup] : "—");
      const cedillas = [
        ...cedillaWords(a.name),
        ...cedillaWords(a.city),
        ...cedillaWords(a.description),
      ];
      console.log(line);
      console.log(`${i + 1}. ${animalDisplayName(a)}${a.hasPhoto ? "" : "   ⚠ SANS PHOTO"}`);
      console.log(line);
      console.log(`Type        : ${TYPE_LABELS[a.type]}`);
      console.log(`Sexe        : ${a.sex ? SEX_LABELS[a.sex] : "—"}`);
      console.log(`Âge         : ${age}`);
      console.log(`Ville       : ${a.city?.trim() || "—"}`);
      console.log(`Județ       : ${countyName(a.county)}${a.priority ? "   ★ prioritaire" : ""}`);
      console.log(`Photos      : ${a.photoCount}`);
      console.log(`Publié      : depuis ${a.days} jour${a.days > 1 ? "s" : ""} (${a.createdAt.toISOString().slice(0, 10)})`);
      console.log(`URL         : ${siteUrl}/animal/${a.id}`);
      console.log(`Id          : ${a.id}`);
      console.log(
        `Diacritiques: ${
          cedillas.length === 0
            ? "OK"
            : `⚠ ş/ţ à cédille dans : ${cedillas.join(", ")}`
        }`,
      );
      console.log(
        `Description : ${a.descriptionLength} caractères${
          a.descriptionLength < SHORT_DESCRIPTION ? `   ⚠ COURTE (< ${SHORT_DESCRIPTION})` : ""
        }`,
      );
      console.log(indent(a.description?.trim() || "(vide)"));
      console.log();
    });
    console.log(line);
    console.log(`Après publication : npm run post:candidats -- publie <id>`);

    trace.trageri = [
      ...trace.trageri.slice(-(REMEMBERED_DRAWS - 1)),
      {
        at: new Date().toISOString(),
        ids: selected.map((a) => a.id),
        counties: selected.map((a) => a.county),
        types: selected.map((a) => a.type),
      },
    ];
    writeTrace(trace);
  });
}

function countyName(code: string): string {
  return COUNTIES.find((c) => c.code === code)?.name ?? code;
}

function indent(text: string): string {
  return text
    .split("\n")
    .map((l) => "    " + l)
    .join("\n");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
