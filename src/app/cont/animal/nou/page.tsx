import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { createAnimal } from "../actions";
import { AnimalForm } from "../animal-form";

export default async function NouAnimalPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/login");
  }

  return (
    <main>
      <h1>Ajouter un animal</h1>
      <AnimalForm
        action={createAnimal}
        userId={session.user.id}
        submitLabel="Créer"
      />
      <p>
        <Link href="/cont">Retour au compte</Link>
      </p>
    </main>
  );
}
