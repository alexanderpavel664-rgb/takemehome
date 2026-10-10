import type { Metadata } from "next";
import type { ReactNode } from "react";
import { animalDisplayName } from "@/lib/animal-display";
import {
  confirmationToken,
  verifyConfirmationToken,
} from "@/lib/confirmation-token";
import { contactStatus } from "@/lib/contact-status";
import { countyName } from "@/lib/counties";
import { prisma } from "@/lib/prisma";
import { STR } from "@/lib/strings";
import { ContactEmailLink } from "@/components/contact-email-link";
import { ContactWarning } from "@/components/contact-warning";
import { AnimalPhoto, PhotoFallback } from "@/components/ui/animal-photo";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmForm } from "./confirm-form";
import type { ConfirmStep } from "./actions";

export const metadata: Metadata = {
  title: STR.confirmari.page.metaTitle,
  // Une page par lien signé : rien à indexer, et l'URL porte le jeton.
  robots: { index: false, follow: false },
};

// Le statut lu ici doit être celui de l'instant : un lien rouvert après
// une confirmation doit montrer l'état nouveau.
export const dynamic = "force-dynamic";

/**
 * Carte centrée sur le papier, la posture des formulaires courts du site.
 * `notice` : un avertissement posé au-dessus, à la même largeur — comme en
 * haut de /cont, sur le papier et non dans la carte.
 */
function Shell({
  children,
  notice,
}: {
  children: ReactNode;
  notice?: ReactNode;
}) {
  return (
    <main className="px-4 pt-10 pb-10 md:px-6 md:pt-16 lg:px-8">
      {notice && <div className="mx-auto mb-4 w-full max-w-lg">{notice}</div>}
      <Card className="mx-auto w-full max-w-lg p-6">{children}</Card>
    </main>
  );
}

/** Lien invalide ou expiré, annonce supprimée, compte suspendu. */
function Notice({
  title,
  text,
  children,
}: {
  title: string;
  text: string;
  children?: ReactNode;
}) {
  return (
    <Shell>
      <h1 className="text-2xl font-semibold text-warm-ink">{title}</h1>
      <p className="mt-2 text-base text-warm-ink">{text}</p>
      {children}
    </Shell>
  );
}

/**
 * /confirmare/[token] — là où mènent les deux boutons de l'email de
 * confirmation (lib/confirmation-email.ts). Le GET ne fait que montrer
 * l'animal et la question : c'est le bouton de la page qui écrit (voir
 * actions.ts), parce que les filtres de messagerie ouvrent les liens des
 * emails avant la personne. Aucune session n'est lue : le lien signé
 * suffit, et ne permet rien d'autre que le statut de cet animal.
 */
export default async function ConfirmarePage({
  params,
}: PageProps<"/confirmare/[token]">) {
  const s = STR.confirmari.page;
  const { token } = await params;
  const verified = verifyConfirmationToken(decodeURIComponent(token));
  if (!verified.ok) {
    return (
      <Notice title={s.invalidTitle} text={s.invalid}>
        <ButtonLink variant="outline" href="/cont" className="mt-6">
          {s.toAccount}
        </ButtonLink>
      </Notice>
    );
  }

  const animal = await prisma.animal.findUnique({
    where: { id: verified.animalId },
    select: {
      id: true,
      name: true,
      type: true,
      count: true,
      city: true,
      county: true,
      status: true,
      hidden: true,
      adoptionSource: true,
      photos: { orderBy: { position: "asc" }, take: 1, select: { url: true } },
      // Le contact du publiant, pour la seule règle de contactStatus : rien
      // n'en est affiché.
      user: {
        select: {
          suspended: true,
          phone: true,
          publicEmail: true,
          contactConsent: true,
        },
      },
    },
  });
  if (!animal) {
    return (
      <Notice title={s.missingTitle} text={s.missing}>
        <ButtonLink variant="outline" href="/cont" className="mt-6">
          {s.toAccount}
        </ButtonLink>
      </Notice>
    );
  }
  if (animal.user.suspended) {
    return (
      <Notice title={s.suspendedTitle} text={s.suspended}>
        <p className="mt-2 text-base text-warm-ink">
          {STR.common.errorContactBefore}
          <ContactEmailLink />
          {STR.common.errorContactAfter}
        </p>
      </Notice>
    );
  }

  const { action } = verified;
  const name = animalDisplayName(animal);
  const plural = animal.count > 1;
  // Déjà adoptée et lien « adopted » : on passe directement à la question.
  const initialStep: ConfirmStep =
    action === "adopted" && animal.status === "ADOPTED"
      ? animal.adoptionSource
        ? "source-done"
        : "source"
      : "ask";
  // « Încă disponibil » d'un publiant sans contact affiché : l'annonce
  // redevient disponible mais reste hors des listes publiques
  // (lib/contact-status.ts). Sans le dire, la page le laisserait croire
  // son annonce en ligne. Le même bloc qu'en haut de /cont, lu à
  // l'ouverture du lien : il reste au-dessus de la carte après le clic.
  const contact = contactStatus(animal.user);
  const noContact = action === "available" && !contact.contactable;
  const currentNote =
    action !== "available"
      ? null
      : animal.status === "ADOPTED"
        ? s.currentAdopted
        : // « Confirmarea îl readuce în pagini » serait faux sans contact :
          // l'avertissement au-dessus dit ce qui l'y ramènera.
          animal.status === "UNCONFIRMED" && !noContact
          ? s.currentUnconfirmed
          : null;

  return (
    <Shell notice={noContact && <ContactWarning status={contact} />}>
      <div className="mb-6 flex items-center gap-4">
        <span className="relative block h-24 w-32 shrink-0 overflow-hidden rounded-md border border-warm-border">
          {animal.photos[0] ? (
            <AnimalPhoto src={animal.photos[0].url} name={name} sizes="128px" />
          ) : (
            <PhotoFallback name={name} />
          )}
        </span>
        <div className="min-w-0">
          <p className="text-lg font-semibold break-words text-warm-ink">
            {name}
          </p>
          <p className="text-sm text-warm-gray">
            {[animal.city?.trim(), countyName(animal.county)]
              .filter(Boolean)
              .join(", ")}
          </p>
        </div>
      </div>
      <ConfirmForm
        token={decodeURIComponent(token)}
        action={action}
        plural={plural}
        initialStep={initialStep}
        currentNote={currentNote}
        groupHint={action === "adopted" && plural}
        alternateHref={`/confirmare/${confirmationToken(
          animal.id,
          action === "available" ? "adopted" : "available",
        )}`}
        listingHref={animal.hidden ? null : `/animal/${animal.id}`}
        noContact={noContact}
      />
    </Shell>
  );
}
