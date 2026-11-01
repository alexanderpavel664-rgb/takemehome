import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import sharp from "sharp";
import { BLOB_HOST } from "@/lib/animal-photo";
import type { KitFormat } from "@/lib/share-kit";

/**
 * L'image du kit de partage : photo pleine largeur, bande crème, nom, âge,
 * lieu, takemehome.ro. Ni le nom ni le contact du publiant.
 *
 * next/og ne décode pas le WebP (171 photos sur 295 en octobre 2026) : sharp
 * recadre d'abord la photo en JPEG. `attention` vise la zone la plus
 * contrastée, ce qui garde la tête de l'animal mieux qu'un recadrage centré.
 * Rien n'est stocké : ni Blob, ni transformation d'image Vercel.
 *
 * Marges des stories (guide Meta, annonces Instagram Stories) : environ 14 %
 * en haut, 35 % en bas et 6 % sur les côtés sont couverts par l'interface. En
 * 1080 × 1920, le texte tient donc entre y = 269 et y = 1248, et x = 65 et
 * x = 1015. La bande crème continue jusqu'en bas, vide : l'interface se pose
 * dessus.
 */

const LAYOUT: Record<
  KitFormat,
  { width: number; height: number; photoHeight: number; bandTop: number }
> = {
  "4x5": { width: 1080, height: 1350, photoHeight: 1050, bandTop: 36 },
  "9x16": { width: 1080, height: 1920, photoHeight: 960, bandTop: 40 },
};

const MAX_SOURCE_BYTES = 15_000_000;
const CREAM = "#F7F3EA";
const INK = "#2B2622";
const GRAY = "#6B625A";

// Lues au premier appel, puis gardées : une instance en sert plusieurs. Le
// suivi de fichiers est forcé dans next.config.ts (outputFileTracingIncludes).
let fonts: ReturnType<typeof loadFonts> | null = null;
function loadFonts() {
  const file = (name: string) =>
    readFile(join(process.cwd(), "assets/fonts", name));
  return Promise.all([
    file("PlusJakartaSans-Regular.ttf"),
    file("PlusJakartaSans-SemiBold.ttf"),
  ]);
}

// Seulement ce que la police sait dessiner. Sans ce filtre, next/og va
// chercher les émojis et les alphabets absents sur un CDN à chaque image : le
// texte saisi par un publiant ne doit déclencher aucun appel sortant.
function printable(text: string): string {
  return text
    .replace(/[^\p{Script=Latin}\p{N}\p{P}\p{Zs}]/gu, "")
    .replace(/\s+/g, " ")
    .replace(/ ([,.;:!?])/g, "$1")
    .trim();
}

// Le corps suit la longueur : la largeur utile (950 px) tient environ 23
// caractères à 72 px, 30 à 56 px, 39 à 44 px sur deux lignes au plus.
function titleSize(length: number): number {
  return length <= 23 ? 72 : length <= 30 ? 56 : 44;
}

/**
 * L'URL vient toujours de la base (AnimalPhoto), jamais de la requête, et ne
 * part que vers notre store : le contrôle du domaine est une seconde barrière.
 * Pas de redirection suivie.
 */
async function fetchStorePhoto(url: string): Promise<Buffer> {
  if (new URL(url).host !== BLOB_HOST) {
    throw new Error("kit.photo_outside_store");
  }
  const response = await fetch(url, {
    redirect: "error",
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) {
    throw new Error(`kit.photo_http_${response.status}`);
  }
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length > MAX_SOURCE_BYTES) {
    throw new Error("kit.photo_too_large");
  }
  return bytes;
}

export async function renderKitImage({
  format,
  photoUrl,
  title,
  place,
  site,
}: {
  format: KitFormat;
  photoUrl: string;
  /** « Rex, 2 ani » */
  title: string;
  /** « Apahida, Cluj » */
  place: string;
  /** « takemehome.ro » */
  site: string;
}): Promise<Buffer> {
  const { width, height, photoHeight, bandTop } = LAYOUT[format];
  const photo = await sharp(await fetchStorePhoto(photoUrl))
    .resize(width, photoHeight, { fit: "cover", position: "attention" })
    .jpeg({ quality: 88 })
    .toBuffer();
  fonts ??= loadFonts();
  const [regular, semiBold] = await fonts;
  const cleanTitle = printable(title);

  const png = new ImageResponse(
    (
      <div
        style={{
          width,
          height,
          display: "flex",
          flexDirection: "column",
          backgroundColor: CREAM,
          fontFamily: "Plus Jakarta Sans",
        }}
      >
        {/* Satori ne connaît que <img> ; la source est une donnée, pas une URL. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`data:image/jpeg;base64,${photo.toString("base64")}`}
          width={width}
          height={photoHeight}
          alt=""
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            paddingTop: bandTop,
            paddingLeft: 65,
            paddingRight: 65,
            color: INK,
          }}
        >
          <div
            style={{
              display: "block",
              fontSize: titleSize(cleanTitle.length),
              fontWeight: 600,
              lineHeight: 1.2,
              lineClamp: 2,
            }}
          >
            {cleanTitle}
          </div>
          <div style={{ fontSize: 40, color: GRAY, marginTop: 8 }}>
            {printable(place)}
          </div>
          <div style={{ fontSize: 36, fontWeight: 600, marginTop: 16 }}>
            {site}
          </div>
        </div>
      </div>
    ),
    {
      width,
      height,
      fonts: [
        { name: "Plus Jakarta Sans", data: regular, weight: 400, style: "normal" },
        { name: "Plus Jakarta Sans", data: semiBold, weight: 600, style: "normal" },
      ],
    },
  );
  return sharp(Buffer.from(await png.arrayBuffer()))
    .jpeg({ quality: 85, mozjpeg: true })
    .toBuffer();
}
