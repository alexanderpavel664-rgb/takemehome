"use server";

import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { COUNTY_CODES } from "@/lib/counties";
import {
  AgeGroup,
  AnimalSize,
  AnimalStatus,
  AnimalType,
  Sex,
} from "@/generated/prisma/client";

export type AnimalFormState = { error: string } | null;

// Les server actions sont accessibles par POST direct, pas seulement via
// l'UI : chaque action revérifie la session elle-même (le proxy ne fait
// qu'un contrôle optimiste du cookie).
async function requireUserId(): Promise<string> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/login");
  }
  return session.user.id;
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
// (« non renseigné ») ou false.
function parseAnimalForm(
  formData: FormData,
): { ok: true; data: ParsedAnimal } | { ok: false; error: string } {
  const name = text(formData, "name");
  if (!name) {
    return { ok: false, error: "Le nom est obligatoire." };
  }

  const type = optionalEnum(formData, "type", AnimalType);
  if (!type) {
    return { ok: false, error: "Le type d’animal est obligatoire." };
  }

  const county = text(formData, "county");
  if (!(COUNTY_CODES as readonly string[]).includes(county)) {
    return { ok: false, error: "Le județ est obligatoire." };
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

export async function createAnimal(
  _prevState: AnimalFormState,
  formData: FormData,
): Promise<AnimalFormState> {
  const userId = await requireUserId();

  const parsed = parseAnimalForm(formData);
  if (!parsed.ok) {
    return { error: parsed.error };
  }

  await prisma.animal.create({ data: { ...parsed.data, userId } });

  revalidatePath("/cont");
  redirect("/cont");
}

export async function updateAnimal(
  _prevState: AnimalFormState,
  formData: FormData,
): Promise<AnimalFormState> {
  const userId = await requireUserId();
  const id = text(formData, "id");

  const parsed = parseAnimalForm(formData);
  if (!parsed.ok) {
    return { error: parsed.error };
  }

  // Isolation : le filtre { id, userId } rend l'animal d'un autre refuge
  // indistinguable d'un animal inexistant → 404, jamais 403.
  const { count } = await prisma.animal.updateMany({
    where: { id, userId },
    data: parsed.data,
  });
  if (count === 0) {
    notFound();
  }

  revalidatePath("/cont");
  redirect("/cont");
}

export async function setAnimalStatus(formData: FormData): Promise<void> {
  const userId = await requireUserId();
  const id = text(formData, "id");

  const status = optionalEnum(formData, "status", AnimalStatus);
  if (!status) {
    throw new Error("Statut invalide.");
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
  const userId = await requireUserId();
  const id = text(formData, "id");

  const { count } = await prisma.animal.deleteMany({ where: { id, userId } });
  if (count === 0) {
    notFound();
  }

  revalidatePath("/cont");
}
