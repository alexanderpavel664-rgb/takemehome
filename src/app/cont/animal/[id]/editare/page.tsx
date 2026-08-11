import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateAnimal } from "../../actions";
import { AnimalForm } from "../../animal-form";

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
    <main>
      <h1>Modifier {animal.name}</h1>
      <AnimalForm
        action={updateAnimal}
        animalId={animal.id}
        userId={session.user.id}
        initialPhotoUrl={animal.photos[0]?.url}
        submitLabel="Enregistrer"
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
      <p>
        <Link href="/cont">Retour au compte</Link>
      </p>
    </main>
  );
}
