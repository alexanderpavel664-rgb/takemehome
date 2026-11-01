import { animalDisplayName, animalTitleAge } from "@/lib/animal-display";
import { countyName } from "@/lib/counties";
import { countySlug } from "@/lib/judete";
import { kitAnimal } from "@/lib/kit-data";
import { renderKitImage } from "@/lib/kit-image";
import { logError, logInfo } from "@/lib/log";
import { isRateLimited } from "@/lib/rate-limit";
import { KIT_FORMATS, type KitFormat } from "@/lib/share-kit";
import { SITE_URL } from "@/lib/site";
import { getViewer } from "@/lib/viewer";

/**
 * L'image du kit de partage, générée à la demande et jamais stockée.
 * ?format=4x5|9x16 & foto=<position>. La requête choisit parmi les photos de
 * l'annonce, par leur rang : aucune adresse n'y entre. Sous /cont, donc gardée
 * par le proxy ; la session et les droits se revérifient ici (kitAnimal).
 */
export const maxDuration = 15;

const noContent = (status: number) => new Response(null, { status });

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const started = performance.now();
  const viewer = await getViewer();
  if (!viewer) {
    return noContent(401);
  }
  if (await isRateLimited("kit", request.headers, viewer.id)) {
    return noContent(429);
  }
  const query = new URL(request.url).searchParams;
  const format = query.get("format") as KitFormat;
  const position = query.get("foto") ?? "0";
  if (!KIT_FORMATS.includes(format) || !/^[0-9]$/.test(position)) {
    return noContent(400);
  }

  const { id } = await params;
  const animal = await kitAnimal(viewer, id);
  const photo = animal?.photos[Number(position)];
  if (!animal || !photo) {
    return noContent(404);
  }

  const name = animalDisplayName(animal);
  const age = animalTitleAge(animal);
  const county = countyName(animal.county);
  const city = animal.city?.trim();
  try {
    const jpeg = await renderKitImage({
      format,
      photoUrl: photo.url,
      title: age ? `${name}, ${age}` : name,
      place:
        city && countySlug(city) !== countySlug(county)
          ? `${city}, ${county}`
          : county,
      site: new URL(SITE_URL).host,
    });
    const ms = Math.round(performance.now() - started);
    logInfo("kit.image", { format, ms, bytes: jpeg.length });
    return new Response(new Uint8Array(jpeg), {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "private, max-age=300",
        "Server-Timing": `kit;dur=${ms}`,
      },
    });
  } catch (error) {
    logError("kit.image_failed", error, { format });
    return noContent(502);
  }
}
