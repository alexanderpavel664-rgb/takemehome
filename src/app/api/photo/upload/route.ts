import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isRateLimited } from "@/lib/rate-limit";
import { reportError } from "@/lib/report";
import { STR } from "@/lib/strings";

// Refus que cette route prononce elle-même : leur message est écrit en
// roumain dans strings.ts et peut ressortir tel quel. Tout le reste vient
// de @vercel/blob ou du réseau — anglais, technique, parfois bavard sur
// l'infrastructure — et ne doit jamais atteindre le navigateur.
const OWN_REFUSALS: readonly string[] = [
  STR.upload.signInRequired,
  STR.upload.accountSuspended,
  STR.upload.pathNotAllowed,
  STR.upload.animalNotFound,
];

// Génération du jeton d'upload client Vercel Blob. Le fichier ne transite
// jamais par cette fonction : le navigateur l'envoie directement au store
// (c'est ce qui évite la limite de 4,5 Mo des fonctions Vercel).
export async function POST(request: Request): Promise<NextResponse> {
  // Avant request.json(), getSession et tout Prisma : une rafale rejetée
  // ne coûte aucune requête Neon.
  if (await isRateLimited("upload", request.headers)) {
    return NextResponse.json(
      { error: STR.upload.tooManyRequests },
      { status: 429 },
    );
  }

  // Corps illisible : requête forgée ou robot, pas une panne. On refuse sans
  // alerter — sinon le premier scanner venu remplirait la boîte mail.
  let body: HandleUploadBody;
  try {
    body = (await request.json()) as HandleUploadBody;
  } catch {
    return NextResponse.json({ error: STR.upload.failed }, { status: 400 });
  }

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        // Sans cette vérification, n'importe qui pourrait écrire dans le store.
        const session = await auth.api.getSession({ headers: request.headers });
        if (!session) {
          throw new Error(STR.upload.signInRequired);
        }
        const userId = session.user.id;

        // Chaque refuge n'écrit que dans son espace animale/<userId>/.
        if (!pathname.startsWith(`animale/${userId}/`)) {
          throw new Error(STR.upload.pathNotAllowed);
        }

        // Un compte suspendu ne publie plus : le refuser dès le jeton évite
        // qu'il remplisse le store de photos que createAnimal refusera de
        // rattacher — des blobs orphelins que personne ne viendrait purger.
        const account = await prisma.user.findUnique({
          where: { id: userId },
          select: { suspended: true },
        });
        if (account?.suspended) {
          throw new Error(STR.upload.accountSuspended);
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
            throw new Error(STR.upload.animalNotFound);
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
    const message = error instanceof Error ? error.message : "";

    // Un refus prévu (pas de session, chemin hors de son espace, animal
    // inconnu) : c'est une saisie invalide, pas une panne. On répond, on
    // n'alerte pas.
    if (OWN_REFUSALS.includes(message)) {
      return NextResponse.json({ error: message }, { status: 400 });
    }

    // Tout le reste est un échec d'upload — le moment précis où un sauveteur
    // abandonne. Le détail part dans Sentry et les logs, le navigateur ne
    // reçoit qu'une phrase en roumain.
    await reportError("photo.upload_token_failed", error);
    return NextResponse.json({ error: STR.upload.failed }, { status: 500 });
  }
}
