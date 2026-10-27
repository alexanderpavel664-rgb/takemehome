/**
 * Export des données de la vidéo d'adoptions (projet Remotion dans video/).
 *
 *   npx tsx scripts/export-video.mts      depuis la racine du repo — ou,
 *                                         depuis video/, npm run export
 *
 * Base : PRODUCTION_DATABASE_URL de .env.local, toujours — la vidéo montre
 * de vrais animaux. Toutes les requêtes passent par une transaction READ
 * ONLY vérifiée auprès de Postgres. Aucune valeur de .env.local n'est
 * affichée, pas même l'hôte.
 *
 * Écrit :
 *   video/data/export.json     les animaux et le compteur (hors git)
 *   video/public/photos/       leurs photos, copiées du store Blob (hors git)
 *
 * Ce qui est exporté, et rien d'autre :
 *   - adoptés : status ADOPTED, non masqués par la modération, avec photo ;
 *   - disponibles : exactement les annonces de /animale (LISTED_WHERE),
 *     avec photo ;
 *   - le compteur : la somme de `count` des adoptés non masqués — une
 *     fratrie de trois compte trois animaux (voir schema.prisma).
 * Partout, hors annonces de démonstration (comptes de scripts/seed-demo.mts
 * et scripts/seed-captures.mts) et hors comptes suspendus par la modération.
 *
 * Écrit aussi video/data/noms-personnes.json (hors git) : les identifiants
 * des annonces dont le nom ressemble à un prénom et un nom de personne —
 * écartées de la vidéo, à revoir sur le site. Jamais les noms eux-mêmes.
 * Jamais une colonne du publiant : ni nom, ni contact, ni identifiant. Le
 * tri des photos (floues, sombres, trop petites, personnes) se fait
 * ensuite dans video/ (npm run selection).
 */

import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { parseEnv } from "node:util";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient, type Prisma } from "../src/generated/prisma/client";
import { animalDisplayName } from "../src/lib/animal-display";
import { LISTED_WHERE } from "../src/lib/animal-filters";
import { BLOB_HOST } from "../src/lib/animal-photo";
import { countyName } from "../src/lib/counties";

type Db = Prisma.TransactionClient;

const OUT_FILE = "video/data/export.json";
const PERSON_FILE = "video/data/noms-personnes.json";

/** Comptes des scripts de démonstration : jamais dans la vidéo ni le compteur. */
const DEMO_EMAILS = ["demo@takemehome.local", "maria@exemplu.ro"];
const REAL_ACCOUNT = { email: { notIn: DEMO_EMAILS }, suspended: false } satisfies Prisma.UserWhereInput;

/**
 * « Ana Popescu » (exemple inventé) : deux mots à majuscule, sans « și » ni « & » — un prénom
 * et un nom de personne (souvent le publiant, tapé dans le mauvais champ).
 */
const PERSON_NAME = /^[A-ZĂÂÎȘȚ][a-zăâîșț]+ [A-ZĂÂÎȘȚ][a-zăâîșț]+$/u;
/** Mots qui décrivent un animal : « Fetita Calico » n'est pas une personne. */
const ANIMAL_WORDS = new Set(
  "fetita fetiță baiat băiat calico tigrat tigrata tigrată pisica pisică catel cățel catelus cățeluș motan pui mascul femela femelă"
    .split(" "),
);
const looksLikePerson = (name: string) =>
  PERSON_NAME.test(name) && !name.split(" ").some((w) => ANIMAL_WORDS.has(w.toLocaleLowerCase("ro")));
const PHOTO_DIR = "video/public/photos";

// ——— Base ————————————————————————————————————————————————————————————

function productionUrl(): string {
  let env: Record<string, string | undefined>;
  try {
    env = parseEnv(readFileSync(".env.local", "utf8")) as Record<string, string | undefined>;
  } catch {
    console.error("Impossible de lire .env.local — lancer depuis la racine du repo.");
    process.exit(1);
  }
  const url = env.PRODUCTION_DATABASE_URL;
  if (!url) {
    console.error("PRODUCTION_DATABASE_URL absente de .env.local.");
    process.exit(1);
  }
  return url;
}

/** Même porte que scripts/post-candidats.mts : READ ONLY, confirmé par Postgres. */
async function withReadOnlyDb<T>(url: string, fn: (db: Db) => Promise<T>): Promise<T> {
  const prisma = new PrismaClient({ adapter: new PrismaNeon({ connectionString: url }) });
  try {
    return await prisma.$transaction(
      async (tx) => {
        await tx.$executeRaw`SET TRANSACTION READ ONLY`;
        const [row] = await tx.$queryRaw<{ transaction_read_only: string }[]>`SHOW transaction_read_only`;
        if (row?.transaction_read_only !== "on") {
          throw new Error(
            `La base n'a pas confirmé la lecture seule (transaction_read_only = ` +
              `${row?.transaction_read_only ?? "?"}) : arrêt avant toute lecture.`,
          );
        }
        return fn(tx);
      },
      // Neon peut mettre quelques secondes à réveiller une branche endormie.
      { maxWait: 30_000, timeout: 120_000 },
    );
  } finally {
    await prisma.$disconnect();
  }
}

// ——— Lecture ——————————————————————————————————————————————————————————

// Colonnes de l'animal seulement : aucun `user`, ni dans select ni dans
// include. Le filtre LISTED_WHERE lit bien le compte, mais côté base.
const ANIMAL_SELECT = {
  id: true,
  name: true,
  type: true,
  count: true,
  city: true,
  county: true,
  updatedAt: true,
  photos: {
    orderBy: { position: "asc" },
    select: { id: true, url: true, position: true, width: true, height: true },
  },
} satisfies Prisma.AnimalSelect;

type Row = Prisma.AnimalGetPayload<{ select: typeof ANIMAL_SELECT }>;

export type ExportPhoto = {
  id: string;
  /** Chemin sous video/public/, pour staticFile(). */
  file: string;
  position: number;
  width: number | null;
  height: number | null;
};

export type ExportAnimal = {
  id: string;
  /** Le nom affiché sur le site (animalDisplayName) — jamais vide. */
  name: string;
  /** false : « Cățel », « Pisică »… mis faute de nom. */
  named: boolean;
  type: Row["type"];
  count: number;
  city: string | null;
  county: string;
  updatedAt: string;
  photos: ExportPhoto[];
};

async function read(db: Db) {
  const adoptedWhere = { status: "ADOPTED", hidden: false, user: REAL_ACCOUNT } satisfies Prisma.AnimalWhereInput;
  const adopted = await db.animal.findMany({
    where: { ...adoptedWhere, photos: { some: {} } },
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    select: ANIMAL_SELECT,
  });
  const available = await db.animal.findMany({
    where: { ...LISTED_WHERE, AND: [{ user: REAL_ACCOUNT }], photos: { some: {} } },
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    select: ANIMAL_SELECT,
  });
  const counted = await db.animal.aggregate({ where: adoptedWhere, _sum: { count: true }, _count: true });
  const viaSite = await db.animal.aggregate({
    where: { ...adoptedWhere, adoptionSource: "TAKEMEHOME" },
    _sum: { count: true },
  });
  // Ce que le compteur laisse de côté, pour le vérifier : adoptés masqués,
  // de démonstration, de comptes suspendus.
  const excluded = {
    hidden: await db.animal.count({ where: { status: "ADOPTED", hidden: true } }),
    demo: await db.animal.count({ where: { status: "ADOPTED", user: { email: { in: DEMO_EMAILS } } } }),
    suspended: await db.animal.count({ where: { status: "ADOPTED", user: { suspended: true } } }),
  };
  // Noms de personnes : sur toutes les annonces publiques ou adoptées.
  const people = (
    await db.animal.findMany({
      where: { status: { in: ["ADOPTED", "AVAILABLE"] }, hidden: false, name: { contains: " " } },
      select: { id: true, name: true, status: true },
    })
  ).filter((a) => looksLikePerson(a.name?.trim() ?? ""));
  return {
    adopted,
    available,
    adoptedAnimals: counted._sum.count ?? 0,
    adoptedListings: counted._count,
    adoptedViaSite: viaSite._sum.count ?? 0,
    excluded,
    people: people.map(({ id, status }) => ({ id, status })),
  };
}

// ——— Photos ——————————————————————————————————————————————————————————

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/** Seul le store Blob du site est accepté : aucune URL arbitraire n'est suivie. */
async function download(photo: Row["photos"][number]): Promise<string | null> {
  let parsed: URL;
  try {
    parsed = new URL(photo.url);
  } catch {
    return null;
  }
  if (parsed.protocol !== "https:" || parsed.host !== BLOB_HOST) return null;

  const known = readdirSync(PHOTO_DIR).find((f) => f.startsWith(`${photo.id}.`));
  if (known) return `photos/${known}`;

  const res = await fetch(parsed);
  if (!res.ok) return null;
  const type = res.headers.get("content-type")?.split(";")[0] ?? "";
  const ext = EXTENSIONS[type];
  if (!ext) return null;
  writeFileSync(`${PHOTO_DIR}/${photo.id}.${ext}`, Buffer.from(await res.arrayBuffer()));
  return `photos/${photo.id}.${ext}`;
}

async function toExport(rows: Row[], failures: string[]): Promise<ExportAnimal[]> {
  const out: ExportAnimal[] = [];
  for (const row of rows) {
    const photos: ExportPhoto[] = [];
    for (const photo of row.photos) {
      const file = await download(photo);
      if (file) {
        photos.push({ id: photo.id, file, position: photo.position, width: photo.width, height: photo.height });
      } else {
        failures.push(photo.id);
      }
    }
    if (photos.length === 0) continue;
    out.push({
      id: row.id,
      name: animalDisplayName(row),
      named: Boolean(row.name?.trim()),
      type: row.type,
      count: row.count,
      city: row.city?.trim() || null,
      county: countyName(row.county),
      updatedAt: row.updatedAt.toISOString(),
      photos,
    });
  }
  return out;
}

// ——— Main ————————————————————————————————————————————————————————————

console.log("Base : PRODUCTION (PRODUCTION_DATABASE_URL), transaction READ ONLY");
const data = await withReadOnlyDb(productionUrl(), read);
console.log(
  `Lu : ${data.adopted.length} annonces adoptées avec photo, ` +
    `${data.available.length} disponibles sur /animale avec photo.`,
);

mkdirSync(PHOTO_DIR, { recursive: true });
mkdirSync("video/data", { recursive: true });
const failures: string[] = [];
const personIds = new Set(data.people.map((p) => p.id));
const adopted = await toExport(data.adopted.filter((a) => !personIds.has(a.id)), failures);
const available = await toExport(data.available.filter((a) => !personIds.has(a.id)), failures);
writeFileSync(
  PERSON_FILE,
  JSON.stringify(
    {
      note:
        "Annonces dont le nom ressemble à un prénom et un nom de personne : écartées de la vidéo, à revoir sur le site. Identifiants seulement.",
      exportedAt: new Date().toISOString(),
      annonces: data.people,
    },
    null,
    2,
  ) + "\n",
);

// Les photos d'annonces sorties de l'export (supprimées, masquées, plus
// disponibles) ne restent pas sur le disque.
const kept = new Set([...adopted, ...available].flatMap((a) => a.photos.map((p) => p.file)));
let removed = 0;
for (const f of readdirSync(PHOTO_DIR)) {
  if (!kept.has(`photos/${f}`)) {
    rmSync(`${PHOTO_DIR}/${f}`);
    removed++;
  }
}

writeFileSync(
  OUT_FILE,
  JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      counter: {
        /** Le nombre affiché : animaux adoptés, fratries comptées par tête. */
        adoptedAnimals: data.adoptedAnimals,
        adoptedListings: data.adoptedListings,
        /** Dont adoptés par quelqu'un qui les a trouvés sur le site (réponse facultative). */
        adoptedViaSite: data.adoptedViaSite,
      },
      adopted,
      available,
    },
    null,
    2,
  ) + "\n",
);

console.log(
  `Écrit : ${OUT_FILE} — ${adopted.length} adoptés, ${available.length} disponibles, ` +
    `compteur ${data.adoptedAnimals} animaux adoptés (${data.adoptedListings} annonces, ` +
    `dont ${data.adoptedViaSite} déclarés trouvés sur le site).`,
);
console.log(
  `Hors compteur : ${data.excluded.hidden} adoptés masqués, ${data.excluded.demo} de démonstration, ` +
    `${data.excluded.suspended} de comptes suspendus.`,
);
console.log(`Noms de personnes écartés : ${data.people.length} annonces, identifiants dans ${PERSON_FILE}.`);
console.log(`Photos : ${kept.size} dans ${PHOTO_DIR}${removed ? `, ${removed} anciennes retirées` : ""}.`);
if (failures.length > 0) {
  console.log(`Photos non copiées (URL hors store ou téléchargement refusé) : ${failures.join(", ")}`);
}
