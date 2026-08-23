import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { loginHref } from "@/lib/next-path";
import { prisma } from "@/lib/prisma";
import { STR } from "@/lib/strings";
import { getViewer } from "@/lib/viewer";
import { ReportForm } from "./report-form";

export const metadata: Metadata = {
  title: STR.report.metaTitle,
  // Un formulaire de signalement n'a rien à faire dans un index : il
  // n'apporte rien à une recherche et attirerait surtout des robots.
  robots: { index: false, follow: false },
};

// L'existence de l'annonce et son masquage doivent être frais : une annonce
// masquée entre-temps ne doit plus pouvoir être signalée.
export const dynamic = "force-dynamic";

export default async function SemnaleazaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Compte exigé. Le lien « Semnalează » de la fiche reste visible pour
  // tous : c'est ici que l'anonyme part vers /login, et `next` le ramène
  // sur ce formulaire une fois connecté. getViewer rend la main sans
  // toucher la base quand il n'y a pas de cookie de session.
  const viewer = await getViewer();
  if (!viewer) {
    redirect(loginHref(`/animal/${id}/semnaleaza`));
  }

  // Même filtre que la fiche publique : une annonce masquée est
  // indistinguable d'une annonce inexistante → 404.
  const animal = await prisma.animal.findFirst({
    where: { id, hidden: false },
    select: { id: true, name: true },
  });
  if (!animal) {
    notFound();
  }

  return (
    // Carte ivoire centrée sur le papier crème, avec de l'air au-dessus —
    // la posture de /login et /inregistrare, les deux autres formulaires
    // courts qu'on atteint depuis une autre page. Un formulaire de cinq
    // lignes ne se colle pas sous l'en-tête comme le ferait un écran de
    // travail (/cont/animal/nou), il se pose au milieu du papier.
    <main className="px-4 pt-10 pb-10 md:px-6 md:pt-16 lg:px-8">
      <ReportForm
        animalId={animal.id}
        animalName={animal.name}
        animalHref={`/animal/${animal.id}`}
      />
    </main>
  );
}
