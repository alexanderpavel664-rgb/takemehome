"use server";

import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { del } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { getViewer, type Viewer } from "@/lib/viewer";
import { COUNTY_CODES } from "@/lib/counties";
import { isOwnedAnimalPhotoUrl } from "@/lib/animal-photo";
import { isRateLimited } from "@/lib/rate-limit";
import { logError } from "@/lib/log";
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
  name: string;
  type: AnimalType;
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

// Seuls name, type et county sont obligatoires ; le reste vaut null
// (« non renseigné ») ou false. Les trois champs sont validés d'un coup :
// toutes les erreurs sont collectées, pas une correction à la fois.
function parseAnimalForm(
  formData: FormData,
): { ok: true; data: ParsedAnimal } | { ok: false; fieldErrors: FieldErrors } {
  const name = text(formData, "name");
  const type = optionalEnum(formData, "type", AnimalType);
  const county = text(formData, "county");
  const countyValid = (COUNTY_CODES as readonly string[]).includes(county);

  if (!name || !type || !countyValid) {
    return {
      ok: false,
      fieldErrors: {
        ...(name ? {} : { name: STR.animalForm.nameRequired }),
        ...(type ? {} : { type: STR.animalForm.typeRequired }),
        ...(countyValid ? {} : { county: STR.animalForm.countyRequired }),
      },
    };
  }

  return {
    ok: true,
    data: {
      name,
      type,
      sex: optionalEnum(formData, "sex", Sex),
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

// La suppression côté store est un nettoyage best-effort : la base fait foi,
// et un échec réseau ici ne doit pas faire échouer l'action (le blob orphelin
// n'est plus référencé nulle part). del() est idempotent côté Vercel.
async function deleteBlobs(urls: string[]): Promise<void> {
  if (urls.length === 0) {
    return;
  }
  try {
    await del(urls);
  } catch (error) {
    // Log seul, sans alerte : un blob orphelin ne coûte que du stockage et
    // n'empêche personne de publier. Alerter ici ne ferait que du bruit.
    logError("blob.delete_failed", error, { count: urls.length });
  }
}

export async function createAnimal(
  _prevState: AnimalFormState,
  formData: FormData,
): Promise<AnimalFormState> {
  // Avant la session et tout Prisma : une rafale rejetée ne coûte rien.
  if (await isRateLimited("animal-write", await headers())) {
    return { formError: STR.animalForm.tooManyRequests };
  }
  const viewer = await requireViewer();
  if (viewer.suspended) {
    return { formError: STR.animalForm.accountSuspended };
  }
  const userId = viewer.id;

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
  const viewer = await requireViewer();
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
