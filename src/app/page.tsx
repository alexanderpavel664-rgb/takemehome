import { prisma } from "@/lib/prisma";

// Test de bout en bout de la connexion : toujours interroger la base,
// jamais de pré-rendu statique de cette page.
export const dynamic = "force-dynamic";

export default async function Home() {
  const animalCount = await prisma.animal.count();

  return (
    <main>
      <h1>TakeMeHome</h1>
      <p>{animalCount} animaux en base</p>
    </main>
  );
}
