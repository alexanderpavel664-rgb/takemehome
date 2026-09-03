/**
 * Fiches dont le « nom » est un bouche-trou — écrit parce que le champ
 * était obligatoire avant que « Nu are nume » existe (V2, septembre 2026).
 *
 *   npm run nume:lipsa                        liste les fiches concernées
 *   npm run nume:lipsa -- corecteaza <id…>    met leur nom à NULL (= « Nu
 *                                             are nume ») : l'annonce
 *                                             affiche alors « Cățel » /
 *                                             « Pisică »
 *
 * Critères STRICTS (la règle convenue) : nom exactement « - », « Nu are »,
 * « nu are », « N/A », ou un seul caractère. Le script signale aussi, à
 * part, des candidats PROCHES (« Nu are. », « Fara », « Nu se stie »…) qu'il
 * ne corrige que si leur id est passé explicitement.
 *
 * Rien n'est modifié sans `corecteaza`, et `corecteaza` ne touche qu'aux
 * ids passés ET reconnus par un des deux critères : un id d'une fiche
 * normalement nommée est refusé. La base visée est celle de .env.local.
 */

import { readFileSync } from "node:fs";
import { parseEnv } from "node:util";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { COUNTIES } from "../src/lib/counties";
import { TYPE_LABELS } from "../src/lib/animal-labels";

const STRICT = new Set(["-", "Nu are", "nu are", "N/A"]);

/** La règle convenue : les quatre chaînes, ou un seul caractère. */
export function isPlaceholderName(name: string | null): boolean {
  if (name === null) return false;
  const trimmed = name.trim();
  return STRICT.has(trimmed) || [...trimmed].length === 1;
}

/** Proche sans être dans la règle : à décider à la main, jamais d'office. */
const LOOSE =
  /^(nu\s*are\b.*|n\/?a\.?|f[aă]r[aă](\s*nume)?\.?|nu\s*(se\s*)?[sș]ti[eu]\.?|necunoscut\.?|nimic\.?|-{2,}|\?+|\.{2,})$/i;
export function isLooseCandidate(name: string | null): boolean {
  if (name === null || isPlaceholderName(name)) return false;
  return LOOSE.test(name.trim());
}

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

function countyName(code: string): string {
  return COUNTIES.find((c) => c.code === code)?.name ?? code;
}

async function main() {
  const [command, ...ids] = process.argv.slice(2);
  if (command !== undefined && command !== "corecteaza") {
    console.error(`Commande inconnue : ${command}. Commandes : (aucune), corecteaza <id…>.`);
    process.exit(1);
  }

  const prisma = new PrismaClient({
    adapter: new PrismaNeon({ connectionString: databaseUrl() }),
  });

  try {
    // Toutes les fiches : la règle « un seul caractère » ne s'exprime pas
    // en Prisma, et la table tient en mémoire (quelques centaines de lignes).
    const animals = await prisma.animal.findMany({
      select: {
        id: true,
        name: true,
        type: true,
        county: true,
        city: true,
        status: true,
        hidden: true,
        createdAt: true,
        user: { select: { name: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    const strict = animals.filter((a) => isPlaceholderName(a.name));
    const loose = animals.filter((a) => isLooseCandidate(a.name));

    const line = (a: (typeof animals)[number]) =>
      `${a.id}  ${JSON.stringify(a.name)}  ${TYPE_LABELS[a.type]}, ${countyName(a.county)}${
        a.city ? ` / ${a.city}` : ""
      }  ${a.status}${a.hidden ? " (ascuns)" : ""}  ${a.createdAt
        .toISOString()
        .slice(0, 10)}  publié par ${a.user.name}`;

    if (command === undefined) {
      console.log(`Règle stricte (« - », « Nu are », « nu are », « N/A », un caractère) : ${strict.length}`);
      strict.forEach((a) => console.log("  " + line(a)));
      console.log(`\nCandidats proches, NON inclus (à passer explicitement) : ${loose.length}`);
      loose.forEach((a) => console.log("  " + line(a)));
      console.log(`\nDéjà sans nom (NULL) : ${animals.filter((a) => a.name === null).length}`);
      console.log(`\nPour corriger : npm run nume:lipsa -- corecteaza <id…>`);
      return;
    }

    if (ids.length === 0) {
      console.error("Usage : npm run nume:lipsa -- corecteaza <id> [id…]");
      process.exit(1);
    }
    const allowed = new Set([...strict, ...loose].map((a) => a.id));
    const toFix = ids.filter((id) => allowed.has(id));
    for (const id of ids) {
      if (!allowed.has(id)) {
        const a = animals.find((x) => x.id === id);
        console.error(
          a
            ? `Refusé (nom normal ou déjà NULL) : ${id} ${JSON.stringify(a.name)}`
            : `Inconnu en base : ${id}`,
        );
      }
    }
    if (toFix.length === 0) {
      console.log("Rien à corriger.");
      return;
    }
    const { count } = await prisma.animal.updateMany({
      where: { id: { in: toFix } },
      data: { name: null },
    });
    console.log(`${count} fiche(s) passée(s) à « Nu are nume » :`);
    toFix.forEach((id) => {
      const a = animals.find((x) => x.id === id)!;
      console.log(`  ${id}  ${JSON.stringify(a.name)} → NULL (${TYPE_LABELS[a.type]})`);
    });
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
