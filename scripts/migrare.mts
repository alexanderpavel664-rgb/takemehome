/**
 * Migrations Prisma sur une branche Neon précise, sans jamais afficher une
 * chaîne de connexion.
 *
 *   npm run migrare -- essai             rejoue les migrations en attente dans
 *                                        une transaction ANNULÉE (essai à blanc)
 *   npm run migrare -- status            prisma migrate status
 *   npm run migrare -- deploy            prisma migrate deploy
 *
 *   … -- --productie                     sur la production plutôt que la dev
 *
 * Base : DIRECT_URL de .env.local (branche dev), ou PRODUCTION_DIRECT_URL avec
 * --productie — toujours la chaîne SANS « -pooler » : une migration ne passe
 * pas par le pooler de Neon (prisma.config.ts). .env.local fait foi, et lui
 * seul : une variable restée dans le shell viserait une autre base.
 *
 * Toute la sortie de Prisma est filtrée : hôtes et URL deviennent « DEV » ou
 * « PRODUCȚIE ». En production, on commence par `essai`, puis `deploy`.
 */

import { spawn } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import { parseEnv } from "node:util";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../src/generated/prisma/client";

const args = process.argv.slice(2);
const production = args.includes("--productie");
const command = args.find((a) => !a.startsWith("--"));
if (command !== "essai" && command !== "status" && command !== "deploy") {
  console.error("Usage : npm run migrare -- essai|status|deploy [--productie]");
  process.exit(1);
}

let env: Record<string, string | undefined>;
try {
  env = parseEnv(readFileSync(".env.local", "utf8")) as Record<string, string | undefined>;
} catch {
  console.error("Impossible de lire .env.local — lancer depuis la racine du repo.");
  process.exit(1);
}

const variable = production ? "PRODUCTION_DIRECT_URL" : "DIRECT_URL";
const url = env[variable]?.trim();
if (!url) {
  console.error(`${variable} absente ou vide dans .env.local.`);
  process.exit(1);
}

/** Endpoint Neon sans « -pooler » : les deux chaînes d'une même branche se valent. */
function endpoint(value: string | undefined): string | null {
  if (!value) return null;
  try {
    return new URL(value).hostname.replace(/-pooler(?=\.)/, "");
  } catch {
    return null;
  }
}

const host = endpoint(url);
if (!host) {
  console.error(`${variable} n'est pas une URL lisible.`);
  process.exit(1);
}
if (new URL(url).hostname.includes("-pooler.")) {
  console.error(`${variable} passe par le pooler : il faut la chaîne SANS « -pooler ».`);
  process.exit(1);
}
// La production et la dev sur la même base : l'étiquette mentirait.
const other = production
  ? [env.DIRECT_URL, env.DATABASE_URL]
  : [env.PRODUCTION_DIRECT_URL, env.PRODUCTION_DATABASE_URL];
if (other.some((value) => endpoint(value) === host)) {
  console.error("Les chaînes de dev et de production visent la même branche : corriger .env.local.");
  process.exit(1);
}

const LABEL = production ? "PRODUCȚIE" : "DEV";
// Tout ce qui pourrait trahir une chaîne : les URL entières, puis chaque
// hôte Neon connu (avec ou sans -pooler), remplacés par une étiquette.
const secrets = [env.DIRECT_URL, env.DATABASE_URL, env.PRODUCTION_DIRECT_URL, env.PRODUCTION_DATABASE_URL]
  .filter((value): value is string => Boolean(value?.trim()))
  .map((value) => value.trim());
const hosts = secrets.flatMap((value) => {
  const plain = endpoint(value);
  return plain ? [plain, plain.replace(/^([^.]+)/, "$1-pooler")] : [];
});
function redact(text: string): string {
  let out = text.replace(/postgres(?:ql)?:\/\/\S+/g, `<${LABEL}>`);
  for (const value of [...secrets, ...hosts].sort((a, b) => b.length - a.length)) {
    out = out.split(value).join(LABEL);
  }
  return out.replace(/[a-z0-9-]+\.[a-z0-9.-]*neon\.tech/gi, LABEL);
}

console.log("═".repeat(72));
console.log(`BASE : ${LABEL}   (${variable}, ${command})`);
console.log("═".repeat(72));

if (command === "essai") {
  await dryRun();
} else {
  // prisma.config.ts charge .env.local sans écraser l'environnement : la
  // DIRECT_URL posée ici gagne.
  const child = spawn("npx", ["prisma", "migrate", command], {
    env: { ...process.env, DIRECT_URL: url },
    stdio: ["inherit", "pipe", "pipe"],
  });
  child.stdout.on("data", (chunk: Buffer) => process.stdout.write(redact(chunk.toString())));
  child.stderr.on("data", (chunk: Buffer) => process.stderr.write(redact(chunk.toString())));
  child.on("exit", (code) => process.exit(code ?? 1));
}

/**
 * Essai à blanc : les migrations du dossier absentes de _prisma_migrations
 * sont exécutées dans UNE transaction, qu'on annule ensuite. Rien ne reste
 * en base, mais une erreur (doublon qui casse un index unique, colonne déjà
 * là…) sort ici plutôt qu'au milieu d'un vrai déploiement.
 */
async function dryRun() {
  const directory = "prisma/migrations";
  const all = readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  const prisma = new PrismaClient({ adapter: new PrismaNeon({ connectionString: url! }) });
  class Rollback extends Error {}
  try {
    const applied = await prisma.$queryRaw<{ migration_name: string }[]>`
      SELECT migration_name FROM "_prisma_migrations"
      WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL`;
    const done = new Set(applied.map((row) => row.migration_name));
    const pending = all.filter((name) => !done.has(name));
    console.log(`${done.size} migration(s) appliquée(s), ${pending.length} en attente.`);
    if (pending.length === 0) return;

    await prisma.$transaction(
      async (tx) => {
        for (const name of pending) {
          const sql = readFileSync(`${directory}/${name}/migration.sql`, "utf8")
            .split("\n")
            .filter((line) => !line.trim().startsWith("--"))
            .join("\n");
          const statements = sql.split(";").map((s) => s.trim()).filter(Boolean);
          for (const statement of statements) {
            await tx.$executeRawUnsafe(statement);
          }
          console.log(`  ✓ ${name} (${statements.length} instruction(s))`);
        }
        throw new Rollback();
      },
      { maxWait: 30_000, timeout: 120_000 },
    );
  } catch (error) {
    if (error instanceof Rollback) {
      console.log("Essai réussi, transaction annulée : rien n'a changé en base.");
      return;
    }
    console.error(`Essai en échec (transaction annulée) : ${redact(error instanceof Error ? error.message : String(error))}`);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}
