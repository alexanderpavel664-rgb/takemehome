"use server";

import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getViewer, type Viewer } from "@/lib/viewer";
import { COUNTY_CODES } from "@/lib/counties";
import { isOwnedAnimalPhotoUrl, MAX_PHOTOS } from "@/lib/animal-photo";
import { PUBLISHER_STATUS, type PublisherStatus } from "@/lib/animal-labels";
import { deleteBlobs } from "@/lib/blob";
import { isRateLimited } from "@/lib/rate-limit";
import { reportError } from "@/lib/report";
import { STR } from "@/lib/strings";
import {
  AgeGroup,
  AnimalSize,
  AnimalType,
  Sex,
  type Prisma,
} from "@/generated/prisma/client";

/** Erreurs par champ : chaque message s'affiche sous le champ concerné. */
type FieldErrors = {
  name?: string;
  type?: string;
  county?: string;
  photo?: string;
  count?: string;
  sex?: string;
  availableUntil?: string;
};

export type AnimalFormState = {
  fieldErrors?: FieldErrors;
  formError?: string;
} | null;

// Les server actions sont accessibles par POST direct, pas seulement via
// l'UI : chaque action revérifie la session elle-même (le proxy ne fait
// qu'un contrôle optimiste du cookie). La suspension est relue en base au
// même moment : une session ouverte avant la suspension ne doit pas
// continuer à publier.
//
// Réservé aux actions sans saisie (statut, suppression) : pour les
// formulaires, createAnimal et updateAnimal rendent une erreur à l'écran
// plutôt qu'un redirect, qui emporterait tout ce qui est tapé.
async function requireViewer(): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) {
    redirect("/login");
  }
  return viewer;
}

function text(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function optionalText(formData: FormData, name: string): string | null {
  return text(formData, name) || null;
}

function optionalEnum<T extends string>(
  formData: FormData,
  name: string,
  allowed: Record<string, T>,
): T | null {
  const raw = text(formData, name);
  return raw && (Object.values(allowed) as string[]).includes(raw)
    ? (raw as T)
    : null;
}

function checkbox(formData: FormData, name: string): boolean {
  return formData.get(name) === "on";
}

type ParsedAnimal = {
  /** NULL = « Nu are nume » : l'annonce affiche « Cățel » / « Pisică ». */
  name: string | null;
  type: AnimalType;
  count: number;
  mustStayTogether: boolean;
  availableUntil: Date | null;
  sex: Sex | null;
  ageGroup: AgeGroup | null;
  ageText: string | null;
  size: AnimalSize | null;
  county: string;
  city: string | null;
  description: string | null;
  sterilized: boolean;
  vaccinated: boolean;
  dewormed: boolean;
  microchipped: boolean;
  goodWithKids: boolean;
  goodWithDogs: boolean;
  goodWithCats: boolean;
  status: PublisherStatus;
};

// Combien d'animaux dans l'annonce. Absent (ancien formulaire, JavaScript
// coupé) vaut 1 ; sinon un entier de 1 à 99 — au-delà, ce n'est plus une
// annonce, c'est un inventaire. null = invalide.
const MAX_COUNT = 99;
function parseCount(formData: FormData): number | null {
  const raw = text(formData, "count");
  if (!raw) {
    return 1;
  }
  if (!/^\d{1,2}$/.test(raw)) {
    return null;
  }
  const n = Number.parseInt(raw, 10);
  return n >= 1 && n <= MAX_COUNT ? n : null;
}

// « AAAA-LL-JJ » d'un <input type="date">, ou vide. La valeur devient un
// jour à minuit UTC — exactement ce que Prisma lit d'une colonne DATE, et
// ce qu'il y écrit. L'aller-retour par toISOString refuse le 31 février.
function parseDate(
  formData: FormData,
  name: string,
): { ok: true; value: Date | null } | { ok: false } {
  const raw = text(formData, name);
  if (!raw) {
    return { ok: true, value: null };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return { ok: false };
  }
  const date = new Date(`${raw}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== raw) {
    return { ok: false };
  }
  return { ok: true, value: date };
}

// Seuls type et county sont obligatoires, plus le nom sauf si « Nu are
// nume » est coché ; le reste vaut null (« non renseigné ») ou false. Tout
// est validé d'un coup : toutes les erreurs sont collectées, pas une
// correction à la fois.
function parseAnimalForm(
  formData: FormData,
): { ok: true; data: ParsedAnimal } | { ok: false; fieldErrors: FieldErrors } {
  // Case cochée = pas de nom, quoi que contienne le champ (désactivé par
  // le formulaire, il ne part de toute façon pas).
  const noName = checkbox(formData, "noName");
  const name = noName ? null : text(formData, "name");
  const type = optionalEnum(formData, "type", AnimalType);
  const county = text(formData, "county");
  const countyValid = (COUNTY_CODES as readonly string[]).includes(county);
  const count = parseCount(formData);
  const sex = optionalEnum(formData, "sex", Sex);
  // « Mixt » n'a de sens que pour plusieurs animaux : le formulaire ne le
  // propose qu'à partir de 2, mais un POST direct ou un nombre redescendu
  // sans JavaScript arriveraient ici.
  const sexValid = sex !== "MIXED" || (count !== null && count > 1);
  const availableUntil = parseDate(formData, "availableUntil");

  if (
    (!noName && !name) ||
    !type ||
    !countyValid ||
    count === null ||
    !sexValid ||
    !availableUntil.ok
  ) {
    return {
      ok: false,
      fieldErrors: {
        ...(noName || name ? {} : { name: STR.animalForm.nameRequired }),
        ...(type ? {} : { type: STR.animalForm.typeRequired }),
        ...(countyValid ? {} : { county: STR.animalForm.countyRequired }),
        ...(count === null ? { count: STR.animalForm.countInvalid } : {}),
        ...(sexValid ? {} : { sex: STR.animalForm.sexMixedSingle }),
        ...(availableUntil.ok
          ? {}
          : { availableUntil: STR.animalForm.availableUntilInvalid }),
      },
    };
  }

  return {
    ok: true,
    data: {
      name,
      type,
      count,
      // Un animal seul ne « s'adopte pas ensemble » : la case n'est même
      // pas rendue sous 2, et une valeur restée d'une édition précédente
      // retombe à false ici.
      mustStayTogether: count > 1 && checkbox(formData, "mustStayTogether"),
      availableUntil: availableUntil.value,
      sex,
      ageGroup: optionalEnum(formData, "ageGroup", AgeGroup),
      ageText: optionalText(formData, "ageText"),
      size: optionalEnum(formData, "size", AnimalSize),
      county,
      city: optionalText(formData, "city"),
      description: optionalText(formData, "description"),
      sterilized: checkbox(formData, "sterilized"),
      vaccinated: checkbox(formData, "vaccinated"),
      dewormed: checkbox(formData, "dewormed"),
      microchipped: checkbox(formData, "microchipped"),
      goodWithKids: checkbox(formData, "goodWithKids"),
      goodWithDogs: checkbox(formData, "goodWithDogs"),
      goodWithCats: checkbox(formData, "goodWithCats"),
      // AVAILABLE ou ADOPTED seulement : UNCONFIRMED n'est jamais un choix
      // du publiant (lib/confirmations.ts).
      status: optionalEnum(formData, "status", PUBLISHER_STATUS) ?? "AVAILABLE",
    },
  };
}

/** Une photo de la liste envoyée par le formulaire, dans l'ordre voulu. */
type PhotoInput = { url: string; width: number | null; height: number | null };

// Dimension mesurée par le canvas de compression : un entier plausible, ou
// rien. Elle ne sert qu'à og:image:width/height — une valeur forgée ne
// fausserait que l'aperçu de sa propre annonce.
function dimension(value: unknown): number | null {
  return typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 1 &&
    value <= 10_000
    ? value
    : null;
}

// `photos` : la liste COMPLÈTE et ordonnée des photos de l'annonce, en JSON —
// celles déjà en ligne et les nouvelles, que le navigateur vient d'envoyer à
// Vercel Blob. La première est la principale. Absente (formulaire soumis sans
// JavaScript, qui ne peut de toute façon rien envoyer au store) : null, et
// les photos restent telles quelles — jamais « aucune photo ».
//
// Ici, seulement la forme : au plus MAX_PHOTOS, des URL, sans doublon.
// L'appartenance de chaque URL se vérifie dans l'action, qui seule sait
// quelles photos l'annonce a déjà.
function parsePhotos(
  formData: FormData,
): { ok: true; photos: PhotoInput[] | null } | { ok: false; error: string } {
  const raw = formData.get("photos");
  if (typeof raw !== "string") {
    return { ok: true, photos: null };
  }
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return { ok: false, error: STR.animalForm.photoUrlInvalid };
  }
  if (!Array.isArray(value)) {
    return { ok: false, error: STR.animalForm.photoUrlInvalid };
  }
  if (value.length > MAX_PHOTOS) {
    return { ok: false, error: STR.animalForm.photosTooMany };
  }
  const photos: PhotoInput[] = [];
  for (const item of value as unknown[]) {
    if (
      item === null ||
      typeof item !== "object" ||
      !("url" in item) ||
      typeof item.url !== "string" ||
      photos.some((p) => p.url === item.url)
    ) {
      return { ok: false, error: STR.animalForm.photoUrlInvalid };
    }
    photos.push({
      url: item.url,
      width: "width" in item ? dimension(item.width) : null,
      height: "height" in item ? dimension(item.height) : null,
    });
  }
  return { ok: true, photos };
}

export async function createAnimal(
  _prevState: AnimalFormState,
  formData: FormData,
): Promise<AnimalFormState> {
  // Avant la session et tout Prisma : une rafale rejetée ne coûte rien.
  if (await isRateLimited("animal-write", await headers())) {
    return { formError: STR.animalForm.tooManyRequests };
  }
  // Session expirée pendant la saisie : une erreur dans le formulaire, pas
  // un redirect vers /login — le redirect jetterait tout ce qui est tapé.
  // La personne se reconnecte dans une autre fila et renvoie le même
  // formulaire.
  const viewer = await getViewer();
  if (!viewer) {
    return { formError: STR.animalForm.sessionExpired };
  }
  if (viewer.suspended) {
    return { formError: STR.animalForm.accountSuspended };
  }
  const userId = viewer.id;

  const parsed = parseAnimalForm(formData);
  // La photo reste facultative, à la création comme à l'édition : un
  // sauveteur à 23 h avec un animal stressé, une association qui saisit
  // depuis un ordinateur sans les photos sous la main, un upload qui échoue
  // en 4G — aucun ne doit être empêché de publier. Une fiche sans photo
  // vaut mieux qu'une fiche jamais créée ; /cont invite à en ajouter une.
  const photos = parsePhotos(formData);
  // À la création, toutes les photos sont nouvelles : chacune doit venir de
  // l'espace animale/<userId>/ du compte connecté (voir animal-photo.ts).
  const photoError = !photos.ok
    ? photos.error
    : photos.photos?.some((p) => !isOwnedAnimalPhotoUrl(p.url, userId))
      ? STR.animalForm.photoUrlInvalid
      : null;
  if (!parsed.ok || photoError) {
    // Erreurs des champs et des photos réunies en une seule réponse.
    return {
      fieldErrors: {
        ...(parsed.ok ? {} : parsed.fieldErrors),
        ...(photoError ? { photo: photoError } : {}),
      },
    };
  }
  const newPhotos = (photos.ok && photos.photos) || [];

  // Un plantage ici est l'échec silencieux à ne pas rater : le sauveteur a
  // tout saisi, tout envoyé, et n'obtiendrait rien. On alerte, et on rend la
  // main en gardant sa saisie à l'écran plutôt qu'en le jetant sur l'écran
  // d'erreur. redirect() reste HORS du try : il fonctionne en levant une
  // exception, que ce catch avalerait.
  try {
    await prisma.animal.create({
      data: {
        ...parsed.data,
        userId,
        // Positions 0, 1, 2… dans l'ordre du formulaire : la 0 est la
        // principale.
        ...(newPhotos.length > 0
          ? {
              photos: {
                create: newPhotos.map((p, position) => ({ ...p, position })),
              },
            }
          : {}),
      },
    });
  } catch (error) {
    await reportError("animal.create_failed", error, {
      userId,
      county: parsed.data.county,
      photos: newPhotos.length,
    });
    return { formError: STR.animalForm.saveFailed };
  }

  revalidatePath("/cont");
  redirect("/cont?confirmation=creation");
}

export async function updateAnimal(
  _prevState: AnimalFormState,
  formData: FormData,
): Promise<AnimalFormState> {
  // Avant la session et tout Prisma : une rafale rejetée ne coûte rien.
  if (await isRateLimited("animal-write", await headers())) {
    return { formError: STR.animalForm.tooManyRequests };
  }
  // Même règle qu'à la création : la session expirée est une erreur de
  // formulaire, jamais un redirect qui emporte la saisie.
  const viewer = await getViewer();
  if (!viewer) {
    return { formError: STR.animalForm.sessionExpired };
  }
  if (viewer.suspended) {
    return { formError: STR.animalForm.accountSuspended };
  }
  const userId = viewer.id;
  const id = text(formData, "id");

  const parsed = parseAnimalForm(formData);
  const photos = parsePhotos(formData);
  if (!parsed.ok || !photos.ok) {
    // Erreurs des champs et des photos réunies en une seule réponse.
    return {
      fieldErrors: {
        ...(parsed.ok ? {} : parsed.fieldErrors),
        ...(photos.ok ? {} : { photo: photos.error }),
      },
    };
  }

  // Isolation : le filtre { id, userId } rend l'animal d'un autre refuge
  // indistinguable d'un animal inexistant → 404, jamais 403. Ses photos
  // actuelles viennent avec la même lecture.
  // notFound() reste HORS du try, comme redirect() : il lève lui aussi.
  let owned: {
    photos: {
      url: string;
      width: number | null;
      height: number | null;
      createdAt: Date;
    }[];
  } | null;
  try {
    owned = await prisma.animal.findFirst({
      where: { id, userId },
      select: {
        photos: {
          orderBy: { position: "asc" },
          select: { url: true, width: true, height: true, createdAt: true },
        },
      },
    });
  } catch (error) {
    await reportError("animal.update_failed", error, { userId, animalId: id });
    return { formError: STR.animalForm.saveFailed };
  }
  if (!owned) {
    notFound();
  }

  // Chaque URL envoyée est soit une photo que l'annonce a déjà, soit une
  // nouvelle photo de l'espace animale/<userId>/ du compte connecté (voir
  // animal-photo.ts) — jamais celle d'un autre refuge.
  const existing = new Map(owned.photos.map((p) => [p.url, p]));
  const wanted = photos.photos;
  if (
    wanted?.some(
      (p) => !existing.has(p.url) && !isOwnedAnimalPhotoUrl(p.url, userId),
    )
  ) {
    return { fieldErrors: { photo: STR.animalForm.photoUrlInvalid } };
  }
  // Rien à écrire côté photos : formulaire sans JavaScript (null), ou même
  // liste dans le même ordre.
  const unchanged =
    wanted === null ||
    (wanted.length === owned.photos.length &&
      wanted.every((p, i) => p.url === owned.photos[i].url));
  const removed = unchanged
    ? []
    : owned.photos.filter((p) => !wanted.some((w) => w.url === p.url));

  // Les champs et les photos dans UNE transaction : l'annonce n'est jamais à
  // moitié enregistrée. Les photos sont réécrites en bloc — effacées puis
  // recréées aux positions 0, 1, 2… — : avec une position unique par
  // annonce, renuméroter ligne à ligne heurterait l'index à mi-chemin. Une
  // photo gardée garde ses dimensions et sa date ; une nouvelle prend celles
  // que le canvas a mesurées. Seules les photos RETIRÉES quittent le store,
  // après la transaction : remplacer la principale ne touche plus aux
  // autres.
  try {
    const operations: Prisma.PrismaPromise<unknown>[] = [
      prisma.animal.update({
        where: { id },
        data: {
          ...parsed.data,
          // Plus adoptée : la réponse « L-a adoptat cineva care l-a găsit pe
          // takemehome.ro? » ne vaut plus rien et fausserait le bilan.
          ...(parsed.data.status !== "ADOPTED" && { adoptionSource: null }),
        },
      }),
    ];
    if (!unchanged) {
      operations.push(
        prisma.animalPhoto.deleteMany({ where: { animalId: id } }),
        prisma.animalPhoto.createMany({
          data: wanted.map((p, position) => {
            const kept = existing.get(p.url);
            return kept
              ? {
                  animalId: id,
                  url: p.url,
                  position,
                  width: kept.width,
                  height: kept.height,
                  createdAt: kept.createdAt,
                }
              : { animalId: id, url: p.url, position, width: p.width, height: p.height };
          }),
        }),
      );
    }
    await prisma.$transaction(operations);
  } catch (error) {
    // Les nouvelles photos sont déjà dans le store : resoumettre est sans
    // danger, le formulaire réutilise les URL déjà obtenues.
    await reportError("animal.update_failed", error, {
      userId,
      animalId: id,
      photos: wanted?.length ?? -1,
    });
    return { formError: STR.animalForm.saveFailed };
  }

  // Jamais d'écrasement de blob — les URL sont immuables, le cache CDN d'un
  // overwrite mettrait jusqu'à 60 s à expirer : une photo remplacée est une
  // nouvelle URL, l'ancienne s'efface ici.
  await deleteBlobs(removed.map((p) => p.url));

  revalidatePath("/cont");
  redirect("/cont?confirmation=modification");
}

export async function setAnimalStatus(formData: FormData): Promise<void> {
  const viewer = await requireViewer();
  // Changer le statut, c'est modifier l'annonce : un compte suspendu ne le
  // peut plus. L'écran /cont n'affiche même pas le bouton dans ce cas —
  // arriver ici veut dire POST forgé, à qui on répond comme au reste :
  // 404, jamais 403.
  if (viewer.suspended) {
    notFound();
  }
  const userId = viewer.id;
  const id = text(formData, "id");

  // AVAILABLE ou ADOPTED : c'est aussi le bouton « Reactivează anunțul »
  // d'une annonce inactive (UNCONFIRMED → AVAILABLE).
  const status = optionalEnum(formData, "status", PUBLISHER_STATUS);
  if (!status) {
    throw new Error(STR.upload.invalidStatus);
  }

  // updatedAt explicite : c'est lui qui clôt le cycle de confirmation
  // (lib/confirmations.ts). Sans lui, une annonce réactivée garderait son
  // cycle échu et la tâche du lendemain la masquerait de nouveau. `hidden`
  // n'est pas touché : une annonce masquée par la modération le reste.
  // Remise en ligne d'une annonce adoptée : la réponse sur l'origine de
  // l'adoption part avec le statut, sinon le bilan compterait une adoption
  // pour un animal toujours disponible.
  const { count } = await prisma.animal.updateMany({
    where: { id, userId },
    data: {
      status,
      updatedAt: new Date(),
      ...(status !== "ADOPTED" && { adoptionSource: null }),
    },
  });
  if (count === 0) {
    notFound();
  }

  revalidatePath("/cont");
}

export async function deleteAnimal(formData: FormData): Promise<void> {
  // Volontairement ouvert aux comptes suspendus : supprimer sa propre
  // annonce, c'est retirer du contenu, jamais en publier. Le lui interdire
  // reviendrait à séquestrer ce qu'on lui reproche.
  const { id: userId } = await requireViewer();
  const id = text(formData, "id");

  // Les URLs sont lues avant la suppression (le cascade efface les lignes
  // AnimalPhoto) ; le filtre sur le propriétaire garantit qu'un autre refuge
  // ne peut pas faire supprimer des blobs qui ne sont pas les siens.
  const photos = await prisma.animalPhoto.findMany({
    where: { animal: { id, userId } },
    select: { url: true },
  });

  const { count } = await prisma.animal.deleteMany({ where: { id, userId } });
  if (count === 0) {
    notFound();
  }

  await deleteBlobs(photos.map((p) => p.url));

  revalidatePath("/cont");
}
