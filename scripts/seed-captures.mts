/**
 * Données des captures d'écran de la V3 (page județ, favoris, carrousel,
 * Deparazitat) : une publiante de Cluj et sept annonces de chiens, sur la
 * DEV. Elles ressemblent à ce que publient les vrais sauveteurs, et montrent
 * ce que le site sait faire : portée (count, Mixt), paire inséparable,
 * animal sans nom, échéance avec son badge, chien âgé, plusieurs photos.
 *
 *   npm run seed:captures         crée (ré-exécutable : remplace tout)
 *   npm run seed:captures:clean   supprime tout : compte, annonces, photos
 *                                 en base ET fichiers du store Blob
 *
 * Les captures elles-mêmes : npm run captures (scripts/captures.mts).
 *
 * SÛRETÉ
 * - Branche de dev uniquement. Le nom d'hôte de DATABASE_URL (sans
 *   « -pooler ») doit être celui de la branche de dev, et différer de ceux
 *   de PRODUCTION_DATABASE_URL / PRODUCTION_DIRECT_URL ; sinon arrêt avant
 *   toute écriture. Aucune valeur de .env.local n'est affichée.
 * - Aucun email ne part. exemplu.ro n'est pas un domaine réservé : il peut
 *   appartenir à quelqu'un. Le compte est donc écrit directement en base,
 *   sans passer par l'inscription (qui enverrait l'email de vérification) :
 *   emailVerified, conditions et consentement posés ici, aucune ligne
 *   Account (personne ne peut s'y connecter). Les annonces sont datées de
 *   l'exécution : le cycle de confirmation (21 jours, lib/confirmations.ts)
 *   ne les concerne pas, et il ne tourne que sur la production. Seul un
 *   geste manuel enverrait encore un email : saisir maria@exemplu.ro dans
 *   /parola-uitata d'un serveur branché sur la dev. Ne pas le faire.
 * - Le store Vercel Blob est PARTAGÉ avec la production. Les photos vont
 *   sous animale/<id du compte>/, comme celles du site, et le nettoyage
 *   supprime tout ce préfixe — rien d'autre.
 * - Tout est rattaché au compte EMAIL : la suppression du compte emporte
 *   annonces et photos par cascade (Animal.userId, AnimalPhoto.animalId).
 *
 * PHOTOS — Unsplash, licence Unsplash (gratuite, Unsplash+ exclu), vérifiée
 * photo par photo le 5 octobre 2026 : des chiens et aucune personne
 * reconnaissable, des photos de tous les jours plutôt que de studio, dont
 * le sujet reste entier dans le recadrage 4:3 des cartes. Elles
 * passent par la compression du site (lib/compress-image.ts), exécutée
 * dans WebKit, le moteur de Safari, comme sur l'iPhone d'une bénévole. Les
 * crédits sont écrits dans social-export/captures/credits.txt (hors git).
 */

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { parseEnv } from "node:util";
import { del, list, put } from "@vercel/blob";
import { PrismaNeon } from "@prisma/adapter-neon";
import { build } from "esbuild";
import { webkit } from "playwright";
import { PrismaClient } from "../src/generated/prisma/client";
import type { Prisma } from "../src/generated/prisma/client";
import { animalPhotoPathname, isOwnedAnimalPhotoUrl } from "../src/lib/animal-photo";
import { TERMS_VERSION } from "../src/lib/legal";

const EMAIL = "maria@exemplu.ro";
// Endpoint Neon de la branche de dev — un identifiant, pas un secret (il
// ne donne accès à rien sans le mot de passe). Si la branche est recréée,
// le script refuse de tourner : mettre à jour cette constante.
const DEV_ENDPOINT = "ep-damp-bird-b22yafuv";
const CREDITS_DIR = "social-export/captures";

// .env.local fait foi, et lui seul (même raison que seed-demo.mts : une
// variable restée dans le shell viserait silencieusement une autre base).
let env: Record<string, string | undefined>;
try {
  env = parseEnv(readFileSync(".env.local", "utf8")) as Record<string, string | undefined>;
} catch {
  console.error("Impossible de lire .env.local — lancer depuis la racine du repo.");
  process.exit(1);
}

/** Endpoint sans « -pooler » : sert à comparer, jamais à afficher. */
function endpoint(value: string | undefined): string | null {
  try {
    return value ? new URL(value.trim()).hostname.split(".")[0].replace(/-pooler$/, "") : null;
  } catch {
    return null;
  }
}
const DATABASE_URL = env.DATABASE_URL?.trim();
const devEndpoint = endpoint(DATABASE_URL);
if (
  !DATABASE_URL ||
  devEndpoint !== DEV_ENDPOINT ||
  devEndpoint === endpoint(env.PRODUCTION_DATABASE_URL) ||
  devEndpoint === endpoint(env.PRODUCTION_DIRECT_URL)
) {
  console.error(
    "DATABASE_URL ne vise pas la branche de dev (nom d'hôte comparé) : arrêt, rien n'a été écrit.",
  );
  process.exit(1);
}
const BLOB_TOKEN = env.BLOB_READ_WRITE_TOKEN?.trim();
if (!BLOB_TOKEN) {
  console.error("BLOB_READ_WRITE_TOKEN absente de .env.local.");
  process.exit(1);
}
console.log("Base : branche de dev (DATABASE_URL, nom d'hôte vérifié).");

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString: DATABASE_URL }),
});

const USER = {
  name: "Maria Popescu",
  phone: "0712 345 678",
  publicEmail: EMAIL,
  county: "CJ",
  city: "Cluj-Napoca",
  description:
    "Salvez câini din zona Clujului și îi țin la mine până își găsesc o familie.",
  contactConsent: true,
};

type Photo = {
  /** Identifiant de l'image sur images.unsplash.com. */
  image: string;
  /** Page de la photo sur Unsplash (crédits). */
  page: string;
  author: string;
  profile: string;
};

const PUSCAS = {
  author: "Mihaela Claudia Puscas",
  profile: "https://unsplash.com/@mihaela_claudia_p",
};

type CaptureAnimal = Omit<
  Prisma.AnimalUncheckedCreateInput,
  "userId" | "photos" | "createdAt" | "updatedAt" | "type" | "county" | "availableUntil"
> & {
  photos: Photo[];
  /** « Disponibil până la » dans N jours (jour civil roumain), recalculé à chaque exécution. */
  availableInDays?: number;
};

// Sept annonces du județ de Cluj, toutes les informations remplies, dans
// l'ordre de la grille : le haut de la page des chiens de Cluj, celui que
// l'on capture, montre d'abord la portée, la paire, le chiot sans nom et
// l'échéance. Des descriptions de toutes les longueurs, comme les vraies.
const ANIMALS: CaptureAnimal[] = [
  {
    // Une portée : trois chiots sur une seule annonce, mâles et femelles
    // (Mixt), adoptables séparément (mustStayTogether reste faux).
    name: "Tina, Bubu și Fram",
    count: 3,
    sex: "MIXED",
    ageGroup: "BABY",
    ageText: "2 luni",
    size: "MEDIUM",
    city: "Florești",
    vaccinated: true,
    dewormed: true,
    goodWithKids: true,
    goodWithDogs: true,
    goodWithCats: true,
    description:
      "I-am găsit pe toți trei într-o cutie de carton lăsată lângă containerele de gunoi din Florești, într-o dimineață cu ploaie. Acum au două luni, sunt deparazitați și au primit primul vaccin. Se pot adopta și separat: fiecare își caută familia lui.\n\n" +
      "Tina e cea mai curajoasă, Bubu doarme oriunde apucă, iar Fram nu se dezlipește de picioarele noastre. O să crească de talie medie.",
    photos: [
      { image: "photo-1444212477490-ca407925329e", page: "https://unsplash.com/photos/selective-focus-photography-of-three-brown-puppies-2_3c4dIFYFU", author: "Anoir Chafik", profile: "https://unsplash.com/@anoirchafik" },
    ],
  },
  {
    // Une paire inséparable de deux adultes : « Se adoptă împreună ».
    name: "Rex și Bella",
    count: 2,
    mustStayTogether: true,
    sex: "MIXED",
    ageGroup: "ADULT",
    ageText: "5 și 6 ani",
    size: "MEDIUM",
    city: "Turda",
    sterilized: true,
    vaccinated: true,
    microchipped: true,
    goodWithKids: true,
    goodWithDogs: true,
    description:
      "Rex și Bella au trăit împreună toată viața, în curtea unui bătrân din Turda care a ajuns la azil. Când i-am ținut separați două zile, la veterinar, Bella n-a mâncat nimic. De aceea îi dăm spre adopție doar împreună, unei familii care are loc pentru doi.",
    photos: [
      { image: "photo-1517443191895-202c31142ccd", page: "https://unsplash.com/photos/two-brown-dog-standing-on-green-grass-y48cp69VSZo", author: "Caleb Carl", profile: "https://unsplash.com/@caleb_carl" },
    ],
  },
  {
    // Sans nom (« Nu are nume ») : la carte et la fiche disent « Cățel ».
    name: null,
    sex: "MALE",
    ageGroup: "BABY",
    ageText: "3 luni",
    size: "SMALL",
    city: "Apahida",
    vaccinated: true,
    microchipped: true,
    goodWithKids: true,
    goodWithDogs: true,
    goodWithCats: true,
    description:
      "Găsit săptămâna trecută lângă gara din Apahida. E sănătos, mănâncă bine și se joacă toată ziua.",
    photos: [
      { image: "photo-1700893945560-f1e4f3513e33", page: "https://unsplash.com/photos/a-small-brown-and-white-dog-laying-on-the-ground-Zd2macJlnbs", author: "Absar Pathan", profile: "https://unsplash.com/@a_snapper" },
    ],
  },
  {
    // Échéance dans 10 jours : le badge « Până la … » s'affiche sur la carte
    // et la fiche (URGENCY_WINDOW_DAYS = 14, lib/animal-display.ts).
    name: "Zara",
    availableInDays: 10,
    sex: "FEMALE",
    ageGroup: "YOUNG",
    ageText: "1 an",
    size: "MEDIUM",
    city: "Dej",
    sterilized: true,
    vaccinated: true,
    microchipped: true,
    goodWithKids: true,
    goodWithDogs: true,
    goodWithCats: true,
    description:
      "URGENT! Zara stă într-o pensiune pe care o plătim din buzunarul nostru, iar peste zece zile nu mai avem cum s-o ținem acolo. E o cățelușă de un an, blândă, sterilizată și vaccinată, care se înțelege cu toată lumea. Dacă nu-i găsim până atunci o familie sau măcar o casă temporară, se întoarce pe stradă.",
    photos: [
      { image: "photo-1748086584202-48eb71b6bb1e", page: "https://unsplash.com/photos/a-dog-sits-in-the-grass-Stfpt-DDbDg", author: "Laura Roberts", profile: "https://unsplash.com/@lroberts067" },
    ],
  },
  {
    // Le chien adulte du carrousel : quatre photos de la même séance.
    name: "Maya",
    sex: "FEMALE",
    ageGroup: "ADULT",
    ageText: "4 ani",
    size: "MEDIUM",
    city: "Cluj-Napoca",
    sterilized: true,
    vaccinated: true,
    microchipped: true,
    goodWithKids: true,
    goodWithDogs: true,
    description:
      "Maya a fost găsită în primăvară lângă Florești, slabă și speriată de orice zgomot. Acum doarme toată ziua pe canapea și te urmărește din priviri oriunde te duci. E calmă, merge frumos în lesă și se înțelege bine cu copiii și cu alți câini.",
    photos: [
      { image: "photo-1733050293211-5b70c3460130", page: "https://unsplash.com/photos/a-brown-and-white-dog-laying-on-top-of-a-couch-HYzrkbNSdPs", ...PUSCAS },
      { image: "photo-1733050293327-f72a449c9487", page: "https://unsplash.com/photos/a-brown-and-white-dog-laying-on-top-of-a-couch-P_B59-4kpcY", ...PUSCAS },
      { image: "photo-1733050293517-7711cf37c276", page: "https://unsplash.com/photos/a-brown-and-white-dog-laying-on-top-of-a-couch-BhwfIZ0Rzf4", ...PUSCAS },
      { image: "photo-1733050293270-c761dee45b13", page: "https://unsplash.com/photos/a-brown-and-white-dog-laying-on-top-of-a-black-couch-3lQfu6NXpnU", ...PUSCAS },
    ],
  },
  {
    // Le chien de la section Sănătate : Sterilizat, Vaccinat, Deparazitat.
    name: "Lola",
    sex: "FEMALE",
    ageGroup: "YOUNG",
    ageText: "2 ani",
    size: "MEDIUM",
    city: "Baciu",
    sterilized: true,
    vaccinated: true,
    dewormed: true,
    goodWithKids: true,
    goodWithDogs: true,
    description:
      "Sterilizată, vaccinată și deparazitată, gata de plecare. Timidă la început, apoi nu se mai dezlipește de tine.",
    photos: [
      { image: "photo-1507543139012-85b5900144e4", page: "https://unsplash.com/photos/short-coat-brown-and-white-dog-sitting-near-gray-concrete-wall-during-daytime-1K7Qf8OBXjU", author: "Catarina Carvalho", profile: "https://unsplash.com/@catvcarvalho" },
    ],
  },
  {
    // Un chien âgé et calme : la description dit pourquoi il ferait un bon
    // compagnon (les seniors sont les plus difficiles à placer).
    name: "Grivei",
    sex: "MALE",
    ageGroup: "SENIOR",
    ageText: "11 ani",
    size: "SMALL",
    city: "Cluj-Napoca",
    sterilized: true,
    vaccinated: true,
    microchipped: true,
    goodWithKids: true,
    goodWithDogs: true,
    goodWithCats: true,
    description:
      "Grivei are 11 ani și a trăit toată viața cu aceeași familie, într-o casă de la marginea Clujului. Când stăpâna lui a murit, nimeni din familie nu l-a putut lua, și așa a ajuns la noi.\n\n" +
      "E cel mai liniștit câine pe care l-am avut în grijă. Doarme mult, își face nevoile doar afară, nu roade nimic și nu latră la vecini. Îi plac plimbările scurte, fără grabă, și apoi un colț de canapea lângă tine.\n\n" +
      "Un câine bătrân nu mai are nimic de dovedit: știi de la început ce caracter are, nu trebuie educat și se mulțumește cu puțin. Pentru o persoană în vârstă sau pentru cineva care lucrează de acasă, Grivei ar fi tovarășul ideal.",
    photos: [
      { image: "photo-1684176655400-5c461357b73e", page: "https://unsplash.com/photos/a-dog-is-laying-down-on-a-blanket-zkwXS7I9U0w", author: "Robin Jonathan Deutsch", profile: "https://unsplash.com/@rodeutsch" },
    ],
  },
];

/** Le jour civil à București : [année, mois de 1 à 12, jour]. */
function bucharestDay(now: Date): [number, number, number] {
  const [year, month, day] = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Bucharest",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(now)
    .split("-")
    .map(Number);
  return [year, month, day];
}

/** L'instant du dernier minuit, heure de București. */
function bucharestMidnight(now: Date): number {
  const [hours, minutes, seconds] = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Bucharest",
    hourCycle: "h23",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
    .format(now)
    .split(":")
    .map(Number);
  return now.getTime() - ((hours * 60 + minutes) * 60 + seconds) * 1000 - now.getMilliseconds();
}

// Taille d'une photo de téléphone (12 Mpx) : la compression du site a
// ainsi le même travail qu'avec une vraie photo de bénévole.
const SOURCE_WIDTH = 3024;

type Compressed = { bytes: Buffer; extension: "webp" | "jpg"; width: number; height: number };

async function download(photo: Photo): Promise<Buffer> {
  const url = `https://images.unsplash.com/${photo.image}?w=${SOURCE_WIDTH}&q=90&fm=jpg`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Téléchargement refusé (${response.status}) : ${photo.page}`);
  }
  return Buffer.from(await response.arrayBuffer());
}

/**
 * compressPhoto de lib/compress-image.ts, telle quelle, dans un vrai
 * navigateur : elle a besoin de createImageBitmap et d'un canvas. esbuild
 * l'empaquette (avec ses imports @/…) et WebKit l'exécute.
 */
async function compressAll(sources: Buffer[]): Promise<Compressed[]> {
  const bundle = await build({
    entryPoints: ["src/lib/compress-image.ts"],
    bundle: true,
    write: false,
    format: "iife",
    globalName: "TakeMeHomeCompress",
    platform: "browser",
    tsconfig: "tsconfig.json",
    // site.ts lit cette variable ; dans le navigateur, process n'existe pas.
    define: { "process.env.NEXT_PUBLIC_SITE_URL": "undefined" },
    logLevel: "silent",
  });
  const browser = await webkit.launch();
  try {
    const page = await browser.newPage();
    await page.setContent("<!doctype html><title>compression</title>");
    await page.addScriptTag({ content: bundle.outputFiles[0].text });
    const results: Compressed[] = [];
    for (const source of sources) {
      const result = await page.evaluate(async (base64) => {
        const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
        const file = new File([bytes], "photo.jpg", { type: "image/jpeg" });
        type Compress = (file: File) => Promise<{
          blob: Blob;
          extension: "webp" | "jpg";
          width: number;
          height: number;
        }>;
        const { compressPhoto } = (
          window as unknown as { TakeMeHomeCompress: { compressPhoto: Compress } }
        ).TakeMeHomeCompress;
        const { blob, extension, width, height } = await compressPhoto(file);
        const out = new Uint8Array(await blob.arrayBuffer());
        let binary = "";
        for (let i = 0; i < out.length; i += 0x8000) {
          binary += String.fromCharCode(...out.subarray(i, i + 0x8000));
        }
        return { base64: btoa(binary), extension, width, height };
      }, source.toString("base64"));
      results.push({
        bytes: Buffer.from(result.base64, "base64"),
        extension: result.extension,
        width: result.width,
        height: result.height,
      });
    }
    return results;
  } finally {
    await browser.close();
  }
}

/**
 * Garde anti-collision : le compte créé ici n'a jamais de ligne Account.
 * S'il en a une, quelqu'un s'est réellement inscrit avec cette adresse —
 * on ne touche à rien.
 */
async function refuseRealAccount(): Promise<void> {
  const existing = await prisma.user.findUnique({
    where: { email: EMAIL },
    select: { _count: { select: { accounts: true } } },
  });
  if (existing && existing._count.accounts > 0) {
    console.error(
      `Le compte ${EMAIL} porte un compte de connexion : ce n'est pas celui ` +
        "du script. Par prudence, rien n'a été modifié.",
    );
    process.exit(1);
  }
}

/** Fichiers du store sous animale/<userId>/ : ceux de ce compte, et eux seuls. */
async function storedUrls(userId: string): Promise<string[]> {
  const urls: string[] = [];
  let cursor: string | undefined;
  do {
    // Une opération avancée Vercel Blob par appel (2 000 par mois en Hobby).
    const page = await list({ token: BLOB_TOKEN, prefix: `animale/${userId}/`, cursor });
    urls.push(...page.blobs.map((b) => b.url));
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return urls;
}

async function deleteFromStore(userId: string, urls: string[]): Promise<void> {
  const own = urls.filter((url) => isOwnedAnimalPhotoUrl(url, userId));
  if (own.length !== urls.length) {
    throw new Error("Un fichier hors de l'espace du compte : arrêt, rien n'est supprimé du store.");
  }
  if (own.length > 0) {
    await del(own, { token: BLOB_TOKEN });
  }
}

/** Supprime le compte, ses annonces, leurs photos en base et dans le store. */
async function removeAll(): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { email: EMAIL },
    select: {
      id: true,
      _count: { select: { animals: true } },
      animals: { select: { photos: { select: { url: true } } } },
    },
  });
  if (!user) {
    return false;
  }
  // Le store d'abord : si la suppression y échoue, le compte reste en base
  // et une nouvelle exécution retrouvera ses fichiers.
  const urls = new Set([
    ...user.animals.flatMap((a) => a.photos.map((p) => p.url)),
    ...(await storedUrls(user.id)),
  ]);
  await deleteFromStore(user.id, [...urls]);
  await prisma.user.delete({ where: { id: user.id } });
  console.log(
    `Compte ${EMAIL} supprimé, avec ses ${user._count.animals} annonces ; ` +
      `${urls.size} fichier(s) supprimé(s) du store Blob.`,
  );
  return true;
}

function writeCredits(): void {
  const lines = [
    "Photos des données de démonstration (npm run seed:captures).",
    "Source : Unsplash, sous la licence Unsplash (https://unsplash.com/license),",
    "vérifiée photo par photo le 5 octobre 2026. Aucune n'est une photo Unsplash+.",
    "",
  ];
  for (const animal of ANIMALS) {
    const label = animal.name ?? "Cățel (annonce sans nom)";
    lines.push(`${label} (${animal.photos.length} photo${animal.photos.length > 1 ? "s" : ""})`);
    animal.photos.forEach((photo, i) => {
      lines.push(`  ${i + 1}. ${photo.page}`);
      lines.push(`     Auteur : ${photo.author} (${photo.profile})`);
    });
    lines.push("");
  }
  mkdirSync(CREDITS_DIR, { recursive: true });
  writeFileSync(`${CREDITS_DIR}/credits.txt`, lines.join("\n"));
}

async function seed(): Promise<void> {
  await refuseRealAccount();

  // Réseau et navigateur d'abord : un échec ici ne laisse rien derrière.
  const photos = ANIMALS.flatMap((a) => a.photos);
  console.log(`Téléchargement de ${photos.length} photos Unsplash…`);
  const sources = await Promise.all(photos.map(download));
  console.log("Compression par lib/compress-image.ts dans WebKit…");
  const compressed = await compressAll(sources);

  if (await removeAll()) {
    console.log("(données précédentes remplacées)");
  }

  const user = await prisma.user.create({
    data: {
      email: EMAIL,
      emailVerified: true,
      termsAcceptedAt: new Date(),
      termsVersion: TERMS_VERSION,
      ...USER,
    },
  });

  try {
    // Même chemin que le site : animale/<userId>/photo.<ext> + suffixe
    // aléatoire. Un par un : si un envoi échoue, aucun autre n'est encore en
    // vol quand l'annulation liste le préfixe.
    const uploaded: { url: string }[] = [];
    for (const photo of compressed) {
      uploaded.push(
        await put(animalPhotoPathname(user.id, photo.extension), photo.bytes, {
          access: "public",
          token: BLOB_TOKEN,
          addRandomSuffix: true,
          contentType: photo.extension === "webp" ? "image/webp" : "image/jpeg",
        }),
      );
    }

    // Datées d'aujourd'hui, à trois minutes d'écart (il y a 1, 4, 7…
    // minutes) : la grille, triée par updatedAt, suit l'ordre d'ANIMALS, et
    // aucune n'approche du cycle de confirmation. Juste après minuit (heure
    // de București), aucune ne recule à la veille : elles s'étagent alors à
    // la seconde après minuit, dans le même ordre.
    const now = new Date();
    const midnight = bucharestMidnight(now);
    const [year, month, day] = bucharestDay(now);
    let next = 0;
    await prisma.$transaction(
      ANIMALS.map(({ photos: animalPhotos, availableInDays, ...animal }, i) => {
        const date = new Date(
          Math.max(now.getTime() - (1 + 3 * i) * 60_000, midnight + (ANIMALS.length - i) * 1000),
        );
        return prisma.animal.create({
          data: {
            ...animal,
            type: "DOG",
            county: "CJ",
            userId: user.id,
            createdAt: date,
            updatedAt: date,
            // Colonne DATE : minuit UTC du jour civil roumain visé.
            availableUntil:
              availableInDays === undefined
                ? null
                : new Date(Date.UTC(year, month - 1, day + availableInDays)),
            photos: {
              create: animalPhotos.map((_, position) => {
                const index = next++;
                return {
                  url: uploaded[index].url,
                  position,
                  width: compressed[index].width,
                  height: compressed[index].height,
                };
              }),
            },
          },
        });
      }),
    );
  } catch (error) {
    console.error("Échec : annulation de tout ce qui a été créé.");
    await removeAll();
    throw error;
  }

  writeCredits();
  const total = compressed.reduce((sum, p) => sum + p.bytes.length, 0);
  const formats = [...new Set(compressed.map((p) => p.extension))].join(", ");
  console.log(
    `${ANIMALS.length} annonces (${ANIMALS.reduce((n, a) => n + (a.count ?? 1), 0)} chiens) créées dans le județ de Cluj pour ${EMAIL}, ` +
      `${compressed.length} photos (${formats}, ${Math.round(total / compressed.length / 1000)} ko en moyenne).`,
  );
  console.log(`Crédits : ${CREDITS_DIR}/credits.txt`);
  console.log("Suppression intégrale : npm run seed:captures:clean");
}

async function clean(): Promise<void> {
  await refuseRealAccount();
  if (!(await removeAll())) {
    console.log(`Aucun compte ${EMAIL} en base — rien à supprimer.`);
  }
}

const mode = process.argv[2];
try {
  if (mode === undefined) {
    await seed();
  } else if (mode === "clean") {
    await clean();
  } else {
    console.error(`Argument inconnu « ${mode} » — utiliser sans argument (seed) ou « clean ».`);
    process.exitCode = 1;
  }
} finally {
  await prisma.$disconnect();
}
