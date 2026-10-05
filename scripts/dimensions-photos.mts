/**
 * Dimensions des photos d'avant V3 — AnimalPhoto.width / height, pour
 * og:image:width/height sur toutes les annonces. Depuis V3, le formulaire
 * les envoie à chaque nouvelle photo (mesurées par le canvas de compression).
 *
 *   npm run dimensions:photos                 liste ce qu'il y a à compléter
 *   npm run dimensions:photos -- --ecrit      complète en base
 *   … -- --productie                          sur la production plutôt que la dev
 *
 * Pour chaque photo sans dimensions : une requête Range sur les 64 premiers
 * Ko du fichier public (Vercel Blob), lecture de l'en-tête WebP ou JPEG — le
 * fichier n'est jamais téléchargé en entier. Les photos sont toutes passées
 * par le canvas du formulaire : aucune orientation EXIF, les pixels stockés
 * sont ceux qu'on affiche.
 *
 * N'écrit que width et height d'AnimalPhoto : aucune annonce ne change de
 * date de mise à jour (Animal.updatedAt reste intact, l'ordre des grilles
 * aussi). Rejouable : il ne touche qu'aux photos encore sans dimensions.
 */

import { readFileSync } from "node:fs";
import { parseEnv } from "node:util";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../src/generated/prisma/client";
import { BLOB_HOST } from "../src/lib/animal-photo";

const args = process.argv.slice(2);
const production = args.includes("--productie");
const write = args.includes("--ecrit");

const env = parseEnv(readFileSync(".env.local", "utf8")) as Record<string, string | undefined>;
const variable = production ? "PRODUCTION_DATABASE_URL" : "DATABASE_URL";
const url = env[variable]?.trim();
if (!url) {
  console.error(`${variable} absente ou vide dans .env.local.`);
  process.exit(1);
}

console.log("═".repeat(72));
console.log(`BASE : ${production ? "PRODUCȚIE" : "DEV"}   (${variable}, ${write ? "ÉCRITURE" : "lecture seule"})`);
console.log("═".repeat(72));

/** Largeur × hauteur depuis les premiers octets d'un WebP ou d'un JPEG. */
function readDimensions(bytes: Uint8Array): { width: number; height: number } | null {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const ascii = (offset: number, length: number) =>
    String.fromCharCode(...bytes.subarray(offset, offset + length));

  // WebP : RIFF….WEBP, puis le premier bloc.
  if (bytes.length >= 30 && ascii(0, 4) === "RIFF" && ascii(8, 4) === "WEBP") {
    const chunk = ascii(12, 4);
    if (chunk === "VP8X") {
      // Toile étendue : largeur-1 et hauteur-1 sur 24 bits, petit-boutiste.
      const w = 1 + (bytes[24] | (bytes[25] << 8) | (bytes[26] << 16));
      const h = 1 + (bytes[27] | (bytes[28] << 8) | (bytes[29] << 16));
      return { width: w, height: h };
    }
    if (chunk === "VP8 ") {
      // Avec perte : 14 bits utiles après le code de démarrage 9d 01 2a.
      return {
        width: view.getUint16(26, true) & 0x3fff,
        height: view.getUint16(28, true) & 0x3fff,
      };
    }
    if (chunk === "VP8L") {
      // Sans perte : largeur-1 et hauteur-1 sur 14 bits, après l'octet 0x2f.
      const b = view.getUint32(21, true);
      return { width: 1 + (b & 0x3fff), height: 1 + ((b >> 14) & 0x3fff) };
    }
    return null;
  }

  // JPEG : on parcourt les segments jusqu'au premier SOFn.
  if (bytes.length >= 4 && bytes[0] === 0xff && bytes[1] === 0xd8) {
    let offset = 2;
    while (offset + 9 < bytes.length) {
      if (bytes[offset] !== 0xff) return null;
      const marker = bytes[offset + 1];
      if (marker === 0xff) {
        offset += 1;
        continue;
      }
      const length = view.getUint16(offset + 2);
      const isSof =
        marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
      if (isSof) {
        return { height: view.getUint16(offset + 5), width: view.getUint16(offset + 7) };
      }
      offset += 2 + length;
    }
  }
  return null;
}

async function fetchHead(photoUrl: string): Promise<Uint8Array> {
  const response = await fetch(photoUrl, { headers: { range: "bytes=0-65535" } });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return new Uint8Array(await response.arrayBuffer());
}

const prisma = new PrismaClient({ adapter: new PrismaNeon({ connectionString: url }) });
try {
  const photos = await prisma.animalPhoto.findMany({
    where: { OR: [{ width: null }, { height: null }] },
    select: { id: true, url: true },
    orderBy: { createdAt: "asc" },
  });
  const total = await prisma.animalPhoto.count();
  console.log(`${total} photo(s) en base, ${photos.length} sans dimensions.`);

  let measured = 0;
  let written = 0;
  const skipped: string[] = [];
  const failed: string[] = [];
  for (const photo of photos) {
    // Hors du store (photos de démonstration de la dev) : rien à mesurer ici.
    if (new URL(photo.url).host !== BLOB_HOST) {
      skipped.push(photo.id);
      continue;
    }
    try {
      const dims = readDimensions(await fetchHead(photo.url));
      if (!dims || dims.width < 1 || dims.height < 1) {
        failed.push(photo.id);
        continue;
      }
      measured++;
      if (write) {
        await prisma.animalPhoto.update({ where: { id: photo.id }, data: dims });
        written++;
      }
    } catch {
      failed.push(photo.id);
    }
  }

  console.log(`Mesurées : ${measured}. Hors du store (ignorées) : ${skipped.length}. Échecs : ${failed.length}.`);
  if (failed.length > 0) console.log(`  photos en échec : ${failed.join(", ")}`);
  console.log(write ? `Écrites en base : ${written}.` : "Rien n'est écrit : relancer avec --ecrit pour compléter.");
} finally {
  await prisma.$disconnect();
}
