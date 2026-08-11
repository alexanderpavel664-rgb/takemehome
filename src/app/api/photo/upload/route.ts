import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Génération du jeton d'upload client Vercel Blob. Le fichier ne transite
// jamais par cette fonction : le navigateur l'envoie directement au store
// (c'est ce qui évite la limite de 4,5 Mo des fonctions Vercel).
export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        // Sans cette vérification, n'importe qui pourrait écrire dans le store.
        const session = await auth.api.getSession({ headers: request.headers });
        if (!session) {
          throw new Error("Connectez-vous pour envoyer une photo.");
        }
        const userId = session.user.id;

        // Chaque refuge n'écrit que dans son espace animale/<userId>/.
        if (!pathname.startsWith(`animale/${userId}/`)) {
          throw new Error("Chemin de photo non autorisé.");
        }

        // clientPayload vient du navigateur : on revérifie l'isolation ici.
        // animalId est null sur /cont/animal/nou (l'animal n'existe pas encore) ;
        // createAnimal rattachera la photo au refuge connecté.
        const { animalId } = JSON.parse(clientPayload ?? "{}") as {
          animalId?: string | null;
        };
        if (animalId) {
          const animal = await prisma.animal.findFirst({
            where: { id: animalId, userId },
            select: { id: true },
          });
          if (!animal) {
            throw new Error("Animal introuvable.");
          }
        }

        return {
          allowedContentTypes: ["image/webp", "image/jpeg"],
          // La compression navigateur vise ~200 Ko ; 4 Mo est un garde-fou
          // contre les uploads forgés hors formulaire.
          maximumSizeInBytes: 4 * 1024 * 1024,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ userId, animalId: animalId ?? null }),
        };
      },
      // Jamais appelé en local (Vercel ne peut pas joindre localhost) : la
      // photo est enregistrée en base par la server action après l'upload,
      // le même chemin en dev et en production.
      onUploadCompleted: async () => {},
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur inconnue." },
      { status: 400 },
    );
  }
}
