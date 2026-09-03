"use server";

import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getViewer, type Viewer } from "@/lib/viewer";
import { COUNTY_CODES } from "@/lib/counties";
import { isOwnedAnimalPhotoUrl } from "@/lib/animal-photo";
import { deleteBlobs } from "@/lib/blob";
import { isRateLimited } from "@/lib/rate-limit";
import { reportError } from "@/lib/report";
import { STR } from "@/lib/strings";
import {
  AgeGroup,
  AnimalSize,
  AnimalStatus,
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
  microchipped: boolean;
  goodWithKids: boolean;
  goodWithDogs: boolean;
  goodWithCats: boolean;
  status: AnimalStatus;
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
      microchipped: checkbox(formData, "microchipped"),
      goodWithKids: checkbox(formData, "goodWithKids"),
      goodWithDogs: checkbox(formData, "goodWithDogs"),
      goodWithCats: checkbox(formData, "goodWithCats"),
      status: optionalEnum(formData, "status", AnimalStatus) ?? "AVAILABLE",
    },
  };
}

// photoUrl est renseigné par le formulaire après l'upload client vers Vercel
// Blob. La valeur vient du navigateur : on n'accepte que des URLs du store,
// dans l'espace animale/<userId>/ du refuge connecté (voir animal-photo.ts).
function parsePhotoUrl(
  formData: FormData,
  userId: string,
): { ok: true; url: string | null } | { ok: false; error: string } {
  const url = text(formData, "photoUrl");
  if (!url) {
    return { ok: true, url: null };
  }
  if (!isOwnedAnimalPhotoUrl(url, userId)) {
    return { ok: false, error: STR.animalForm.photoUrlInvalid };
  }
  return { ok: true, url };
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
  const photo = parsePhotoUrl(formData, userId);
  if (!parsed.ok || !photo.ok) {
    // Erreurs des champs et de la photo réunies en une seule réponse.
    return {
      fieldErrors: {
        ...(parsed.ok ? {} : parsed.fieldErrors),
        ...(photo.ok ? {} : { photo: photo.error }),
      },
    };
  }

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
        ...(photo.url
          ? { photos: { create: { url: photo.url, position: 0 } } }
          : {}),
      },
    });
  } catch (error) {
    await reportError("animal.create_failed", error, {
      userId,
      county: parsed.data.county,
      withPhoto: photo.url !== null,
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
  const photo = parsePhotoUrl(formData, userId);
  if (!parsed.ok || !photo.ok) {
    // Erreurs des champs et de la photo réunies en une seule réponse.
    return {
      fieldErrors: {
        ...(parsed.ok ? {} : parsed.fieldErrors),
        ...(photo.ok ? {} : { photo: photo.error }),
      },
    };
  }

  // Isolation : le filtre { id, userId } rend l'animal d'un autre refuge
  // indistinguable d'un animal inexistant → 404, jamais 403.
  // notFound() reste HORS du try, comme redirect() : il lève lui aussi.
  let count: number;
  try {
    ({ count } = await prisma.animal.updateMany({
      where: { id, userId },
      data: parsed.data,
    }));
  } catch (error) {
    await reportError("animal.update_failed", error, { userId, animalId: id });
    return { formError: STR.animalForm.saveFailed };
  }
  if (count === 0) {
    notFound();
  }

  // Remplacement de photo : nouvelle ligne en base, puis suppression des
  // anciennes du store (jamais d'écrasement de blob — les URLs sont
  // immuables, le cache CDN d'un overwrite mettrait jusqu'à 60 s à expirer).
  if (photo.url) {
    // La photo est déjà dans le store à ce stade : si le rattachement en
    // base échoue, l'annonce reste avec l'ancienne image sans que personne ne
    // le sache. Réessayer est sans danger, les deux opérations convergent.
    try {
      const photos = await prisma.animalPhoto.findMany({
        where: { animalId: id },
        select: { id: true, url: true },
      });
      const obsolete = photos.filter((p) => p.url !== photo.url);
      const operations: Prisma.PrismaPromise<unknown>[] = [];
      if (obsolete.length > 0) {
        operations.push(
          prisma.animalPhoto.deleteMany({
            where: { id: { in: obsolete.map((p) => p.id) } },
          }),
        );
      }
      if (!photos.some((p) => p.url === photo.url)) {
        operations.push(
          prisma.animalPhoto.create({
            data: { animalId: id, url: photo.url, position: 0 },
          }),
        );
      }
      if (operations.length > 0) {
        await prisma.$transaction(operations);
      }
      await deleteBlobs(obsolete.map((p) => p.url));
    } catch (error) {
      await reportError("animal.photo_attach_failed", error, {
        userId,
        animalId: id,
      });
      return { formError: STR.animalForm.saveFailed };
    }
  }

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

  const status = optionalEnum(formData, "status", AnimalStatus);
  if (!status) {
    throw new Error(STR.upload.invalidStatus);
  }

  const { count } = await prisma.animal.updateMany({
    where: { id, userId },
    data: { status },
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
