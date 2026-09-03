/**
 * Candidats à publier sur les réseaux sociaux — 5 animaux AVAILABLE.
 *
 *   npm run post:candidats                    liste 5 candidats
 *   npm run post:candidats -- publie <id…>    marque un ou plusieurs animaux
 *                                             comme publiés (ils ne
 *                                             ressortiront plus)
 *   npm run post:candidats -- liste           affiche ce qui a déjà été publié
 *
 * Critères, dans l'ordre :
 *   1. exclus : déjà publiés (trace locale dans social-export/publicate.json,
 *      jamais en base) ;
 *   2. exclus : publiant sans contact affichable — exactement la règle de la
 *      fiche publique (lib/contact-status.ts), plus compte suspendu et
 *      annonce masquée, qui n'ont pas de fiche publique du tout ;
 *   3. privilégiés : avec photo ;
 *   4. privilégiés : publiés depuis longtemps ;
 *   5. variés : județe et types différents dans le tirage, et différents des
 *      derniers tirages et des dernières publications.
 *
 * Lecture seule sur la base. Le seul fichier écrit est la trace locale.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { parseEnv } from "node:util";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { animalDisplayName } from "../src/lib/animal-display";
import { contactStatus } from "../src/lib/contact-status";
import { COUNTIES } from "../src/lib/counties";
import { AGE_GROUP_LABELS, SEX_LABELS, TYPE_LABELS } from "../src/lib/animal-labels";
import { SITE_URL } from "../src/lib/site";

const TRACE_FILE = "social-export/publicate.json";
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

// ——— Base ————————————————————————————————————————————————————————————

// .env.local fait foi, et lui seul (même raison que seed-demo.mts : un
// DATABASE_URL resté dans le shell viserait silencieusement une autre base).
function databaseUrl(): string {
  let url: string | undefined;
  try {
    url = (parseEnv(readFileSync(".env.local", "utf8")) as Record<string, string | undefined>)
      .DATABASE_URL;
  } catch {
    console.error("Impossible de lire .env.local — lancer depuis la racine du repo.");
    process.exit(1);
  }
  if (!url) {
    console.error("DATABASE_URL absente de .env.local.");
    process.exit(1);
  }
  return url;
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
  const [command, ...args] = process.argv.slice(2);
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

  const prisma = new PrismaClient({
    adapter: new PrismaNeon({ connectionString: databaseUrl() }),
  });

  try {
    if (command === "publie") {
      if (args.length === 0) {
        console.error("Usage : npm run post:candidats -- publie <id> [id…]");
        process.exit(1);
      }
      const animals = await prisma.animal.findMany({
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

    if (command !== undefined) {
      console.error(`Commande inconnue : ${command}. Commandes : (aucune), publie, liste.`);
      process.exit(1);
    }

    const publishedIds = new Set(trace.publicate.map((p) => p.id));

    const animals = await prisma.animal.findMany({
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
        photos: { select: { id: true }, take: 1 },
      },
    });

    const now = Date.now();
    const pool = animals
      .filter((a) => contactStatus(a.user).contactable)
      .map((a) => ({
        ...a,
        days: Math.floor((now - a.createdAt.getTime()) / DAY),
        hasPhoto: a.photos.length > 0,
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

    // Sélection gloutonne : la photo pèse plus que tout (un post sans
    // image ne marche pas), puis l'ancienneté en jours, moins des
    // pénalités quand un județ/type est déjà dans la sélection ou dans
    // les tirages récents. Les pénalités sont en « jours équivalents ».
    const selected: typeof pool = [];
    const remaining = [...pool];
    while (selected.length < CANDIDATES && remaining.length > 0) {
      let best = -1;
      let bestScore = -Infinity;
      remaining.forEach((a, i) => {
        const sameCounty = selected.filter((s) => s.county === a.county).length;
        const sameType = selected.filter((s) => s.type === a.type).length;
        const score =
          (a.hasPhoto ? 10_000 : 0) +
          a.days -
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
        `${publishedIds.size} déjà publiés.\n`,
    );
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
      console.log(`Județ       : ${countyName(a.county)}`);
      console.log(`Publié      : depuis ${a.days} jour${a.days > 1 ? "s" : ""} (${a.createdAt.toISOString().slice(0, 10)})`);
      console.log(`URL         : ${SITE_URL}/animal/${a.id}`);
      console.log(`Id          : ${a.id}`);
      console.log(
        `Diacritiques: ${
          cedillas.length === 0
            ? "OK"
            : `⚠ ş/ţ à cédille dans : ${cedillas.join(", ")}`
        }`,
      );
      console.log(`Description :`);
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
  } finally {
    await prisma.$disconnect();
  }
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
