import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { STATUS_LABELS, TYPE_LABELS } from "@/lib/animal-labels";
import { relativeTimeFr } from "@/lib/relative-time";
import { setAnimalStatus } from "./animal/actions";
import { DeleteAnimalButton } from "./animal/delete-animal-button";
import { SignOutButton } from "./sign-out-button";

// La vraie vérification de session se fait ici, dans chaque page protégée :
// le proxy ne fait qu'un contrôle optimiste sur la présence du cookie.
export default async function ContPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/login");
  }

  // Isolation : uniquement les animaux du refuge connecté.
  const animals = await prisma.animal.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    include: { photos: { orderBy: { position: "asc" }, take: 1 } },
  });

  return (
    <main>
      <h1>Mon compte</h1>
      <p>Nom : {session.user.name}</p>
      <p>Email : {session.user.email}</p>
      <p>
        <Link href="/cont/profil">Modifier mon profil</Link>
      </p>

      <h2>Mes animaux</h2>
      <p>
        <Link href="/cont/animal/nou">Ajouter un animal</Link>
      </p>
      {animals.length === 0 ? (
        <p>Aucun animal pour l’instant.</p>
      ) : (
        <ul>
          {animals.map((animal) => (
            <li key={animal.id}>
              {/* Format fixe 160×120, recadrage centré (object-position par
                  défaut). Seule entorse au zéro-CSS : object-fit et l'aplat
                  sans photo sont impossibles en HTML nu. */}
              {animal.photos[0] ? (
                <Image
                  src={animal.photos[0].url}
                  alt={`Photo de ${animal.name}`}
                  width={160}
                  height={120}
                  style={{ width: 160, height: 120, objectFit: "cover" }}
                />
              ) : (
                <span
                  style={{
                    display: "inline-flex",
                    width: 160,
                    height: 120,
                    background: "#ddd",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {animal.name}
                </span>
              )}
              <br />
              <strong>{animal.name}</strong> ({TYPE_LABELS[animal.type]}) —{" "}
              {STATUS_LABELS[animal.status]} — mis à jour{" "}
              {relativeTimeFr(animal.updatedAt)}
              <br />
              <Link href={`/cont/animal/${animal.id}/editare`}>Modifier</Link>
              <form action={setAnimalStatus}>
                <input type="hidden" name="id" value={animal.id} />
                <input
                  type="hidden"
                  name="status"
                  value={animal.status === "AVAILABLE" ? "ADOPTED" : "AVAILABLE"}
                />
                <button type="submit">
                  {animal.status === "AVAILABLE"
                    ? "Marquer comme adopté"
                    : "Marquer comme disponible"}
                </button>
              </form>
              <DeleteAnimalButton id={animal.id} name={animal.name} />
            </li>
          ))}
        </ul>
      )}
      <SignOutButton />
    </main>
  );
}
