"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getViewer } from "@/lib/viewer";
import { deleteBlobs } from "@/lib/blob";
import { reportError } from "@/lib/report";
import { STR } from "@/lib/strings";

export type DeleteAccountState = { formError: string } | null;

/**
 * Effacement du compte — RGPD art. 17. C'est un droit : pas de délai de
 * grâce, pas de « es-tu sûr » qui n'en finit pas, pas de suppression douce
 * qui garderait tout en base sous un drapeau. Ce qui part, part.
 *
 * L'ordre compte, et il est choisi :
 *
 * 1. La session est fermée AVANT l'effacement. signOut a besoin de la ligne
 *    Session pour effacer proprement le cookie ; l'appeler après le cascade
 *    échouerait, et la personne repartirait avec un cookie qui ne désigne
 *    plus rien. L'identifiant est déjà en main à ce moment-là.
 * 2. Les URLs des photos sont lues avant, elles aussi : le cascade efface
 *    les lignes AnimalPhoto, et sans elles on ne saurait plus quoi
 *    supprimer du store.
 * 3. La base ensuite : le cascade de User emporte Animal, AnimalPhoto,
 *    Session et Account (voir schema.prisma).
 * 4. Le store en dernier, en best-effort : une photo orpheline ne coûte que
 *    du stockage, alors qu'une base à moitié effacée serait une fuite.
 *
 * Ce qui NE part pas, et pourquoi : les lignes Report portent l'IP de la
 * personne qui a signalé, pas celle du publiant — ce sont les données d'un
 * tiers. Elles disparaissent quand même ici, par le cascade sur Animal.
 * Les compteurs rateLimit vivent au plus 15 minutes et sont indexés par IP,
 * pas par compte : rien à effacer à la main.
 */
export async function deleteAccount(
  _prevState: DeleteAccountState,
  formData: FormData,
): Promise<DeleteAccountState> {
  // Volontairement ouvert aux comptes suspendus : quelqu'un à qui on a fermé
  // la porte doit pouvoir retirer ses données. Le lui refuser serait garder
  // en otage ce qu'on lui reproche.
  const viewer = await getViewer();
  if (!viewer) {
    redirect("/login");
  }

  // Second verrou, après la confirmation du navigateur : le mot tapé à la
  // main. Il est revalidé ici et pas seulement dans le composant client —
  // une server action est joignable par POST direct.
  const confirmation = formData.get("confirmation");
  if (
    typeof confirmation !== "string" ||
    confirmation.trim() !== STR.profil.deleteConfirmWord
  ) {
    return { formError: STR.profil.deleteConfirmMismatch };
  }

  const userId = viewer.id;
  let photoUrls: string[];

  // redirect() reste HORS du try : il fonctionne en levant une exception,
  // que ce catch avalerait.
  try {
    photoUrls = (
      await prisma.animalPhoto.findMany({
        where: { animal: { userId } },
        select: { url: true },
      })
    ).map((photo) => photo.url);

    await auth.api.signOut({ headers: await headers() });
    await prisma.user.delete({ where: { id: userId } });
  } catch (error) {
    // L'échec à ne pas rater : quelqu'un a demandé l'effacement de ses
    // données et ne l'a pas obtenu. On alerte, et on le lui dit.
    await reportError("account.delete_failed", error, { userId });
    return { formError: STR.profil.deleteFailed };
  }

  await deleteBlobs(photoUrls);

  redirect("/");
}
