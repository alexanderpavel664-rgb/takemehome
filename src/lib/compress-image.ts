// Compression côté navigateur, obligatoire avant tout upload : Vercel plafonne
// le corps des requêtes de fonctions à 4,5 Mo, et les bénévoles envoient des
// photos de téléphone en 4G — 6 Mo doivent devenir ~200 Ko avant de partir
// (1600 px de large max, WebP — ou JPEG sur Safari — à qualité dégressive).
//
// Orientation EXIF : createImageBitmap et drawImage appliquent l'orientation
// au décodage sur tous les navigateurs depuis ~2020 (défaut "from-image").
// Ne pas passer l'option imageOrientation (mot-clé rejeté par Safari < 16,
// Chrome < 112, Firefox < 111) ni faire de rotation manuelle : les deux
// produiraient une image couchée ou doublement tournée. Le réencodage via
// canvas supprime au passage toutes les métadonnées EXIF, y compris les
// coordonnées GPS du domicile des bénévoles.

import { STR } from "@/lib/strings";

const MAX_WIDTH = 1600;
// Qualité dégressive : 0.72 au départ, puis -0.05 par tentative tant que le
// résultat dépasse 300 Ko. Cible ~200 Ko : les bénévoles sont en 4G roumaine.
// Le JPEG (bascule Safari, qui ne sait pas encoder le WebP) compresse moins
// bien à qualité égale : son plancher descend à 0.40 — la dernière marche est
// bornée au plancher — là où le WebP s'arrête à 0.5 en 4 tentatives.
const INITIAL_QUALITY = 0.72;
const QUALITY_STEP = 0.05;
const TARGET_SIZE = 300 * 1024;
const WEBP_LADDER = { minQuality: 0.5, maxRetries: 4 };
const JPEG_LADDER = { minQuality: 0.4, maxRetries: 7 };

export type CompressedPhoto = {
  blob: Blob;
  extension: "webp" | "jpg";
};

async function decode(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file);
    } catch {
      // Certains formats font échouer createImageBitmap (HEIC hors Safari…) :
      // on tente encore le décodage <img> avant d'abandonner.
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    return image;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function toBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

// Encode au type demandé avec qualité dégressive tant que le résultat dépasse
// TARGET_SIZE ; si le plancher est atteint sans y arriver, on garde quand même
// la meilleure version. Renvoie null si le navigateur ne produit pas le type
// demandé (Safari renvoie silencieusement du PNG pour image/webp).
async function encode(
  canvas: HTMLCanvasElement,
  type: "image/webp" | "image/jpeg",
  { minQuality, maxRetries }: { minQuality: number; maxRetries: number },
): Promise<Blob | null> {
  let blob = await toBlob(canvas, type, INITIAL_QUALITY);
  if (!blob || blob.type !== type) {
    return null;
  }
  let previous = INITIAL_QUALITY;
  for (
    let attempt = 1;
    attempt <= maxRetries && blob.size > TARGET_SIZE;
    attempt++
  ) {
    // Recalculée en centièmes à chaque tour : pas d'erreurs de flottants cumulées.
    const stepped =
      Math.round(100 * INITIAL_QUALITY - attempt * 100 * QUALITY_STEP) / 100;
    const quality = Math.max(stepped, minQuality);
    if (quality >= previous) {
      break; // le plancher a déjà été essayé
    }
    previous = quality;
    const retry = await toBlob(canvas, type, quality);
    if (!retry || retry.type !== type) {
      break;
    }
    blob = retry;
  }
  return blob;
}

export async function compressPhoto(file: File): Promise<CompressedPhoto> {
  let source: ImageBitmap | HTMLImageElement;
  try {
    source = await decode(file);
  } catch {
    throw new Error(STR.compress.unsupportedFormat);
  }

  const sourceWidth =
    source instanceof HTMLImageElement ? source.naturalWidth : source.width;
  const sourceHeight =
    source instanceof HTMLImageElement ? source.naturalHeight : source.height;
  if (!sourceWidth || !sourceHeight) {
    throw new Error(STR.compress.unreadable);
  }

  // Jamais d'agrandissement : en dessous de 1600 px, on garde les dimensions.
  const scale = Math.min(1, MAX_WIDTH / sourceWidth);
  const width = Math.round(sourceWidth * scale);
  const height = Math.round(sourceHeight * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error(STR.compress.cannotPrepare);
  }
  context.imageSmoothingQuality = "high";
  context.drawImage(source, 0, 0, width, height);
  if (source instanceof ImageBitmap) {
    source.close();
  }

  // WebP d'abord. Safari (macOS et iOS) ne sait pas encoder le WebP :
  // encode() détecte le type réellement produit et on bascule alors en JPEG,
  // avec la même stratégie de qualité dégressive.
  const webp = await encode(canvas, "image/webp", WEBP_LADDER);
  if (webp) {
    return { blob: webp, extension: "webp" };
  }
  const jpeg = await encode(canvas, "image/jpeg", JPEG_LADDER);
  if (jpeg) {
    return { blob: jpeg, extension: "jpg" };
  }
  throw new Error(STR.compress.compressionFailed);
}
