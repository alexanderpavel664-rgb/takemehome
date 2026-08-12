import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { createAnimal } from "../actions";
import { AnimalForm } from "../animal-form";

export default async function NouAnimalPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/login");
  }

  return (
    <main className="mx-auto max-w-lg p-4 md:max-w-2xl md:px-6 lg:px-8">
      <h1 className="mb-4 text-2xl font-semibold text-warm-ink">
        Ajouter un animal
      </h1>
      {/* Le retour vers /cont passe par le bouton « Annuler » du formulaire. */}
      <AnimalForm
        action={createAnimal}
        userId={session.user.id}
        submitLabel="Créer"
      />
    </main>
  );
}
