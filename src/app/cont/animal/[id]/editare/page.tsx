import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { STR } from "@/lib/strings";
import { Card } from "@/components/ui/card";
import { updateAnimal } from "../../actions";
import { AnimalForm } from "../../animal-form";

export const metadata: Metadata = {
  title: STR.animalForm.editMetaTitle,
};

export default async function EditareAnimalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/login");
  }

  const { id } = await params;

  // Isolation : findFirst({ id, userId }) — l'animal d'un autre refuge est
  // indistinguable d'un animal inexistant → 404, jamais 403 (un 403
  // confirmerait que l'animal existe).
  const animal = await prisma.animal.findFirst({
    where: { id, userId: session.user.id },
    include: { photos: { orderBy: { position: "asc" } } },
  });
  if (!animal) {
    notFound();
  }

  return (
    // w-full : enfant du body en flex-col, mx-auto seul annulerait
    // l'étirement — la page se tasserait sur la largeur de ses champs.
    <main className="mx-auto w-full max-w-2xl px-4 py-4 md:px-6">
      <h1 className="text-2xl font-semibold text-warm-ink">
        {STR.animalForm.editTitle(animal.name)}
      </h1>
      {/* Le formulaire est posé sur l'ivoire : un contenant, pas des champs
          qui flottent sur le papier. */}
      <Card className="mt-4 p-4">
        <AnimalForm
          action={updateAnimal}
          animalId={animal.id}
          userId={session.user.id}
          initialPhotoUrl={animal.photos[0]?.url}
          submitLabel={STR.animalForm.editSubmit}
          initial={{
            name: animal.name,
            type: animal.type,
            sex: animal.sex ?? "",
            ageGroup: animal.ageGroup ?? "",
            ageText: animal.ageText ?? "",
            size: animal.size ?? "",
            county: animal.county,
            city: animal.city ?? "",
            description: animal.description ?? "",
            sterilized: animal.sterilized,
            vaccinated: animal.vaccinated,
            microchipped: animal.microchipped,
            goodWithKids: animal.goodWithKids,
            goodWithDogs: animal.goodWithDogs,
            goodWithCats: animal.goodWithCats,
            status: animal.status,
          }}
        />
      </Card>
    </main>
  );
}
