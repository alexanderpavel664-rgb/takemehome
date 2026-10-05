// Compression côté navigateur, obligatoire avant tout upload : Vercel plafonne
// le corps des requêtes de fonctions à 4,5 Mo, et les bénévoles envoient des
// photos de téléphone en 4G — 6 Mo doivent devenir ~200 Ko avant de partir
// (grand côté 1600 px, WebP — ou JPEG sur Safari — à qualité dégressive).
//
// Orientation EXIF : createImageBitmap et drawImage appliquent l'orientation
// au décodage sur tous les navigateurs depuis ~2020 (défaut "from-image").
// Ne pas passer l'option imageOrientation (mot-clé rejeté par Safari < 16,
// Chrome < 112, Firefox < 111) ni faire de rotation manuelle : les deux
// produiraient une image couchée ou doublement tournée. Le réencodage via
// canvas supprime au passage toutes les métadonnées EXIF, y compris les
// coordonnées GPS du domicile des bénévoles.

import { STR } from "@/lib/strings";

// Dimensions (V3, octobre 2026, réglages validés sur les 175 photos de la
// production réencodées dans Chromium et WebKit) : le GRAND côté est plafonné
// à 1600 px, et non plus la largeur seule — 86 % des photos sont en portrait,
// qu'un plafond en largeur ne réduisait jamais (1600×2133 = 3,4 Mpx, dont la
// fiche n'affichait que le centre). Un 3:4 devient 1200×1600 : la fiche montre
// la photo entière (object-contain), sans perte visible à 2× sur aucun écran.
// Plancher de largeur à 1200 px : une photo 9:16 garde 1200 px de large au
// lieu de tomber à 900 — c'est la largeur que Facebook recommande pour
// og:image, et la première photo est l'aperçu de chaque partage.
const MAX_LONG_SIDE = 1600;
const MIN_WIDTH = 1200;
// Qualité dégressive par pas de 0,05 tant que le résultat dépasse 300 Ko.
// Cible ~200 Ko : les bénévoles sont en 4G roumaine. Si le plancher est
// atteint sans y arriver, on garde la dernière version.
//
// WebP (Chrome, Android, Firefox) : départ à 0.72 ; avec 4 tentatives le
// dernier essai est 0.52 — le plancher 0.5 n'est jamais atteint.
// JPEG (bascule Safari, qui ne sait pas encoder le WebP) : départ à 0.52. Le
// 0.72 de l'encodeur d'Apple vaut ~92 sur l'échelle JPEG standard, bien
// au-dessus du WebP au même chiffre, pour des fichiers 1,6 fois plus lourds ;
// 0.52 vaut ~81, et la qualité obtenue reste supérieure à celle d'avant V3
// (où 45 % des photos d'iPhone finissaient au plancher 0.40).
const QUALITY_STEP = 0.05;
const TARGET_SIZE = 300 * 1024;
type Ladder = { initialQuality: number; minQuality: number; maxRetries: number };
const WEBP_LADDER: Ladder = { initialQuality: 0.72, minQuality: 0.5, maxRetries: 4 };
const JPEG_LADDER: Ladder = { initialQuality: 0.52, minQuality: 0.4, maxRetries: 3 };

export type CompressedPhoto = {
  blob: Blob;
  extension: "webp" | "jpg";
  /** Dimensions du fichier produit, en pixels (og:image:width/height). */
  width: number;
  height: number;
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
  { initialQuality, minQuality, maxRetries }: Ladder,
): Promise<Blob | null> {
  let blob = await toBlob(canvas, type, initialQuality);
  if (!blob || blob.type !== type) {
    return null;
  }
  let previous = initialQuality;
  for (
    let attempt = 1;
    attempt <= maxRetries && blob.size > TARGET_SIZE;
    attempt++
  ) {
    // Recalculée en centièmes à chaque tour : pas d'erreurs de flottants cumulées.
    const stepped =
      Math.round(100 * initialQuality - attempt * 100 * QUALITY_STEP) / 100;
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

  // Grand côté ramené à 1600 px, mais jamais moins de 1200 px de large, et
  // jamais d'agrandissement : une petite photo garde ses dimensions.
  const scale = Math.min(
    1,
    Math.max(
      MAX_LONG_SIDE / Math.max(sourceWidth, sourceHeight),
      MIN_WIDTH / sourceWidth,
    ),
  );
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
    return { blob: webp, extension: "webp", width, height };
  }
  const jpeg = await encode(canvas, "image/jpeg", JPEG_LADDER);
  if (jpeg) {
    return { blob: jpeg, extension: "jpg", width, height };
  }
  throw new Error(STR.compress.compressionFailed);
}
