import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import {
  animalDisplayName,
  deadlineLabel,
  groupLabel,
  shareText,
} from "@/lib/animal-display";
import { STATUS_LABELS, TYPE_LABELS } from "@/lib/animal-labels";
import { contactStatus } from "@/lib/contact-status";
import { longDateRo, pendingHideDate } from "@/lib/confirmations";
import { countyName } from "@/lib/counties";
import { isEmailConfigured } from "@/lib/email";
import { relativeTimeRo } from "@/lib/relative-time";
import { SITE_URL } from "@/lib/site";
import { STR } from "@/lib/strings";
import { getSession } from "@/lib/viewer";
import { AnimalPhoto, PhotoFallback } from "@/components/ui/animal-photo";
import { Badge, DeadlineBadge, Pill } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ShareButton } from "@/components/ui/share-button";
import { setAnimalStatus } from "./animal/actions";
import { DeleteAnimalButton } from "./animal/delete-animal-button";
import { ContactEmailLink } from "@/components/contact-email-link";
import { ContactWarning } from "@/components/contact-warning";
import { InstallBanner } from "./install-banner";
import { SignOutButton } from "./sign-out-button";
import { VerifyEmailNotice } from "./verify-email-notice";

export const metadata: Metadata = {
  title: STR.cont.metaTitle,
};

/**
 * L'écran hebdomadaire des publiantes. Deux contenants et une sortie :
 * la carte Profil (ce que les fiches publiques montrent d'elles), la section
 * Mes animaux (leur travail), la déconnexion en bas de page, derrière une
 * hairline. Largeur de lecture centrée : une page de compte se lit, elle
 * ne s'étale pas.
 */
export default async function ContPage({ searchParams }: PageProps<"/cont">) {
  // La vraie vérification de session se fait ici, dans chaque page protégée :
  // le proxy ne fait qu'un contrôle optimiste sur la présence du cookie.
  // getSession est mis en cache par requête : le layout (porte des
  // conditions) a déjà payé l'aller-retour.
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  const { user } = session;

  // Confirmation posée en query par les server actions (création/édition) :
  // toute autre valeur est simplement ignorée.
  const { confirmation } = await searchParams;
  const confirmationMessage =
    confirmation === "creation"
      ? STR.cont.confirmationCreated
      : confirmation === "modification"
        ? STR.cont.confirmationUpdated
        : null;

  // La suspension ne vit pas dans la session (elle n'est pas déclarée dans
  // les additionalFields de better-auth, pour qu'aucune requête du navigateur
  // ne puisse l'écrire) : elle se relit en base, en parallèle des animaux.
  //
  // Isolation : uniquement les animaux du compte connecté. Select minimal :
  // la rangée n'affiche que nom, type, statut, masquage, date et photo —
  // plus, depuis V2, le nombre, l'âge (pour « 3 pui ») et l'échéance.
  const [account, animals] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { suspended: true },
    }),
    prisma.animal.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        name: true,
        type: true,
        ageGroup: true,
        count: true,
        availableUntil: true,
        status: true,
        hidden: true,
        updatedAt: true,
        // Le cycle de confirmation en cours, pour « E încă disponibil ».
        confirmSentAt: true,
        confirmReminderSentAt: true,
        photos: {
          orderBy: { position: "asc" },
          take: 1,
          select: { url: true },
        },
      },
    }),
  ]);
  const suspended = account?.suspended ?? false;
  // Email à confirmer : seulement quand l'envoi est configuré (lib/email.ts)
  // — sinon on demanderait de cliquer un lien qui n'a jamais été envoyé.
  const emailPending = isEmailConfigured() && !user.emailVerified;

  const phone = user.phone?.trim();
  const publicEmail = user.publicEmail?.trim();
  const contactConsent = user.contactConsent ?? false;
  // La même règle que la fiche publique (lib/contact-status) : tant qu'elle
  // dit « injoignable », le bloc en haut de page reste, et chaque fiche
  // porte sa pastille. La session est relue à chaque rendu et le formulaire
  // de profil fait un router.refresh() après sauvegarde : dès que le profil
  // est complet, tout disparaît sans rien d'autre à faire.
  const contact = contactStatus({ phone, publicEmail, contactConsent });
  const now = new Date();

  // Ce que la carte Profil énumère : exactement ce qui habille les fiches
  // publiques — le nom (« Publié par… ») et les coordonnées de contact.
  const profileRows: { label: string; value?: string }[] = [
    { label: STR.cont.profileName, value: user.name },
    { label: STR.cont.profileAccountEmail, value: user.email },
    { label: STR.cont.profilePhone, value: phone },
    { label: STR.cont.profilePublicEmail, value: publicEmail },
    {
      label: STR.cont.profileCounty,
      value: user.county ? countyName(user.county) : undefined,
    },
    // Toujours affiché, dans les deux états : « nebifată » n'est pas un
    // champ vide qu'on aurait oublié de remplir, c'est une réponse.
    {
      label: STR.cont.profileContactConsent,
      value: contactConsent
        ? STR.cont.contactConsentOn
        : STR.cont.contactConsentOff,
    },
  ];

  return (
    // w-full : enfant du body en flex-col, mx-auto seul annulerait
    // l'étirement et la page se tasserait sur son contenu.
    <main className="mx-auto w-full max-w-3xl px-4 py-4 md:px-6">
      {confirmationMessage && (
        <p
          role="status"
          className="mb-4 rounded-md border border-warm-border bg-card-ivory px-4 py-3 text-sm text-warm-ink"
        >
          {confirmationMessage}
        </p>
      )}
      <h1 className="text-2xl font-semibold text-warm-ink">
        {STR.cont.title}
      </h1>

      {suspended && (
        // La nouvelle qui commande tout le reste de l'écran : elle passe
        // avant le profil. Même langage que les autres avertissements du
        // site — bordure encre épaissie, message en toutes lettres, jamais
        // la couleur seule (la palette n'a pas de rouge, et n'en veut pas).
        // Même carte que l'avertissement de contact juste en dessous : les
        // deux sont posés sur le papier crème, en ivoire.
        // Trois choses, dans l'ordre où on les cherche : ce qui a changé,
        // ce qui reste possible, à qui écrire. Sans les deux dernières, la
        // personne croit à une panne et réessaie.
        <Card role="status" className="mt-4 border-[1.5px] border-warm-ink p-4">
          <h2 className="text-lg font-semibold text-warm-ink">
            {STR.cont.suspendedTitle}
          </h2>
          <p className="mt-1 max-w-[66ch] text-base text-warm-ink">
            {STR.cont.suspendedDescription}
          </p>
          <p className="mt-3 text-base text-warm-ink">
            {STR.cont.suspendedCanStill}
          </p>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-base text-warm-ink">
            {STR.cont.suspendedCanStillList.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p className="mt-3 max-w-[66ch] text-base text-warm-ink">
            {STR.common.errorContactBefore}
            <ContactEmailLink />
            {STR.common.errorContactAfter}
          </p>
        </Card>
      )}

      {/* Profil incomplet : le bloc vient AVANT la carte Profil, pas dedans —
          c'est le scénario le plus probable (inscription, publication, et
          rien d'autre), ses annonces sont alors absentes des listes
          publiques, et il doit être impossible à manquer. Le chemin de
          sortie est dans le bloc. Après la suspension, qui commande tout le
          reste ; persistant tant que la règle dit « injoignable ». */}
      <ContactWarning status={contact} className="mt-4" />

      {emailPending && <VerifyEmailNotice email={user.email} />}

      {/* ——— Profil : ce que les adoptantes voient sur les fiches. ——— */}
      <Card className="mt-4 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-warm-ink">
            {STR.cont.profileTitle}
          </h2>
          <ButtonLink variant="outline" href="/cont/profil">
            {STR.cont.edit}
          </ButtonLink>
        </div>
        <dl className="mt-3 space-y-1 text-base">
          {profileRows.map(({ label, value }) => (
            <div key={label} className="flex flex-wrap gap-x-2">
              <dt className="text-warm-gray">{label} :</dt>
              <dd className={value ? "text-warm-ink" : "text-warm-gray"}>
                {value || STR.cont.notFilled}
              </dd>
            </div>
          ))}
        </dl>
      </Card>

      <InstallBanner />

      {/* ——— Mes animaux : le titre et l'action forment l'en-tête. ——— */}
      <section className="mt-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-warm-ink">
            {STR.cont.myAnimals}
          </h2>
          {/* Le seul bouton plein de l'écran (La Règle du Bouton Unique).
              Compte suspendu : pas de bouton du tout — proposer une action
              qui sera refusée à la soumission serait une promesse en l'air. */}
          {!suspended && (
            <ButtonLink variant="primary" href="/cont/animal/nou">
              {STR.cont.addAnimal}
            </ButtonLink>
          )}
        </div>
        {animals.length === 0 ? (
          // L'état vide vit dans le contenant des animaux, pas sur le fond.
          // Sans action : le primary « Ajouter un animal » est juste au-dessus.
          <Card className="mt-4">
            <EmptyState
              title={STR.cont.emptyTitle}
              description={STR.cont.emptyDescription}
            />
          </Card>
        ) : (
          <ul className="mt-4 space-y-4">
            {animals.map((animal) => {
              const name = animalDisplayName(animal);
              const group = groupLabel(animal);
              const deadline =
                animal.status === "AVAILABLE"
                  ? deadlineLabel(animal.availableUntil, "short", now)
                  : null;
              // Masquée faute de confirmation (lib/confirmations.ts) : c'est
              // l'état du publiant, qu'il lève lui-même — rien à voir avec
              // la modération (`hidden`), qu'il ne peut jamais lever.
              const unconfirmed = animal.status === "UNCONFIRMED";
              // Masquée AUSSI par la modération : c'est cette mention-là qui
              // compte, et « Reactivează » promettrait un retour en ligne
              // qui n'aurait pas lieu. Le bouton revient si l'équipe la
              // démasque.
              const canReactivate = unconfirmed && !suspended && !animal.hidden;
              // Confirmation demandée par email et pas encore donnée : la
              // même réponse que le bouton de l'email, ici — et la seule
              // possible pour une adresse non confirmée, dont l'email n'a
              // pas de boutons.
              const pendingUntil =
                animal.status === "AVAILABLE" && !animal.hidden && !suspended
                  ? pendingHideDate(animal)
                  : null;
              // Partager : seulement une annonce en ligne, disponible et
              // joignable — « caută o familie » serait faux pour une
              // adoptée, le lien d'une annonce masquée mène sur un 404 pour
              // tout le monde sauf sa propriétaire, et celui d'une annonce
              // sans contact sur une fiche qui ne mène nulle part.
              const shareable =
                animal.status === "AVAILABLE" &&
                !animal.hidden &&
                contact.contactable;
              return (
              // La cellule est le conteneur : à la largeur de lecture la carte
              // passe en rangée (photo 160×120 à gauche) dès que la place le
              // permet, et s'empile sur mobile — selon SA largeur (@container),
              // pas celle de l'écran.
              <li key={animal.id} className="@container">
                <Card className="flex flex-col gap-3 p-3 @sm:flex-row">
                  {/* Cellule étroite (< @sm) : photo en haut, pleine largeur
                      en 4:3 ; cellule large : 160×120 à gauche ; recadrage
                      centré (fill + object-cover) ; sans photo : aplat crème
                      + nom (PhotoFallback), jamais d'image de remplacement
                      (DESIGN.md). */}
                  <span className="relative block aspect-[4/3] w-full shrink-0 overflow-hidden rounded-md border border-warm-border @sm:aspect-auto @sm:h-30 @sm:w-40">
                    {animal.photos[0] ? (
                      <AnimalPhoto
                        src={animal.photos[0].url}
                        name={name}
                        sizes="(min-width: 768px) 720px, 100vw"
                      />
                    ) : (
                      <PhotoFallback name={name} />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="font-semibold text-warm-ink">
                        {name}
                      </span>
                      <span className="text-sm text-warm-gray">
                        {TYPE_LABELS[animal.type]}
                      </span>
                      {animal.status === "ADOPTED" ? (
                        <Badge>{STR.animal.adoptedBadge}</Badge>
                      ) : unconfirmed ? (
                        // Hors des listes publiques : la pastille encre
                        // pleine, celle des états qui comptent.
                        <span className="inline-flex items-center rounded-pill bg-warm-ink px-3 py-1 text-[13px] font-semibold text-white">
                          {STR.cont.unconfirmedBadge}
                        </span>
                      ) : (
                        <Pill>{STATUS_LABELS[animal.status]}</Pill>
                      )}
                      {/* Les mêmes pastilles que la carte publique : la
                          publiante voit ce que le public voit — et voit le
                          semn d'échéance apparaître, puis s'effacer. */}
                      {group && <Pill>{group}</Pill>}
                      {deadline && <DeadlineBadge>{deadline}</DeadlineBadge>}
                      {animal.hidden && (
                        // Masquée par la modération : la pastille encre
                        // pleine, celle des états qui comptent — la
                        // publiante doit le voir sans lire la ligne d'à côté.
                        <span className="inline-flex items-center rounded-pill bg-warm-ink px-3 py-1 text-[13px] font-semibold text-white">
                          {STR.cont.hiddenBadge}
                        </span>
                      )}
                      {!contact.contactable && animal.status !== "ADOPTED" && (
                        // Sans contact affiché, l'annonce sort des listes
                        // publiques (LISTED_WHERE) : la même pastille, même
                        // poids. Le contact est celui du compte, donc toutes
                        // les fiches non adoptées la portent ; une fiche
                        // adoptée n'en a pas besoin, elle n'affiche plus de
                        // contact par construction. Seule la propriétaire
                        // lit ceci : /cont est derrière la session.
                        <span className="inline-flex items-center rounded-pill bg-warm-ink px-3 py-1 text-[13px] font-semibold text-white">
                          {STR.cont.noContactBadge}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-warm-gray">
                      {STR.cont.updated(relativeTimeRo(animal.updatedAt))}
                    </p>
                    {animal.hidden && (
                      // Compte suspendu : toutes ses annonces sont masquées
                      // d'un coup, et le bloc en haut de page a déjà dit
                      // pourquoi — une ligne courte suffit. Sinon, c'est
                      // une décision prise sur CETTE annonce : on dit qui,
                      // pourquoi, et à qui écrire.
                      <p className="mt-1 max-w-[66ch] text-sm font-semibold text-warm-ink">
                        {suspended ? (
                          STR.cont.hiddenHintSuspended
                        ) : (
                          <>
                            {STR.cont.hiddenHint}{" "}
                            {STR.common.errorContactBefore}
                            <ContactEmailLink />
                            {STR.common.errorContactAfter}
                          </>
                        )}
                      </p>
                    )}
                    {pendingUntil && (
                      <p className="mt-1 max-w-[66ch] text-sm font-semibold text-warm-ink">
                        {STR.cont.pendingHint(
                          animal.count > 1,
                          longDateRo(pendingUntil),
                        )}
                      </p>
                    )}
                    {canReactivate && (
                      // Ce qui s'est passé et ce qu'il faut faire ; le bouton
                      // est juste en dessous, en tête de la rangée d'actions.
                      <p className="mt-1 max-w-[66ch] text-sm font-semibold text-warm-ink">
                        {STR.cont.unconfirmedHint}
                      </p>
                    )}
                    {!animal.photos[0] &&
                      animal.status !== "ADOPTED" &&
                      !suspended && (
                        // Fiche sans photo : elle est en ligne telle quelle
                        // (la photo est facultative), on invite à en ajouter
                        // une — en gris chaud, une information, pas un
                        // avertissement ; seul le lien est en encre. Il mène
                        // droit au formulaire d'édition, dont le bloc photo
                        // est en tête. Pas pour une fiche adoptée (elle ne
                        // cherche plus personne) ni pour un compte suspendu
                        // (il ne peut plus modifier). Seule la propriétaire
                        // lit ceci : /cont est derrière la session.
                        <p className="mt-1 text-sm text-warm-gray">
                          {STR.cont.noPhotoHint}{" "}
                          <Link
                            href={`/cont/animal/${animal.id}/editare`}
                            className="text-warm-ink underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-warm-ink"
                          >
                            {STR.cont.addPhoto}
                          </Link>
                        </p>
                      )}
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {/* Le partage EN PREMIER, et en outline quand tout le
                          reste est en encre : c'est ici que la publiante
                          regarde ses annonces et décide de les diffuser —
                          le levier de croissance du site. Le seul bouton
                          plein de l'écran reste « Adaugă un animal ». */}
                      {pendingUntil && (
                        // Outline, comme la réactivation : le seul bouton
                        // plein de l'écran reste « Adaugă un animal ».
                        // setAnimalStatus avance updatedAt, ce qui clôt le
                        // cycle de confirmation.
                        <form action={setAnimalStatus}>
                          <input type="hidden" name="id" value={animal.id} />
                          <input type="hidden" name="status" value="AVAILABLE" />
                          <Button variant="outline" type="submit">
                            {STR.cont.stillAvailable}
                          </Button>
                        </form>
                      )}
                      {canReactivate && (
                        // La réactivation en un clic : outline, parce que le
                        // seul bouton plein de l'écran reste « Adaugă un
                        // animal ». Elle ne lève jamais un masquage de la
                        // modération (setAnimalStatus ne touche pas hidden).
                        <form action={setAnimalStatus}>
                          <input type="hidden" name="id" value={animal.id} />
                          <input type="hidden" name="status" value="AVAILABLE" />
                          <Button variant="outline" type="submit">
                            {STR.cont.reactivate}
                          </Button>
                        </form>
                      )}
                      {shareable && (
                        <ShareButton
                          title={name}
                          text={shareText(animal)}
                          url={`${SITE_URL}/animal/${animal.id}`}
                        />
                      )}
                      {/* La publiante voit son annonce comme un adoptant. */}
                      <ButtonLink variant="ghost" href={`/animal/${animal.id}`}>
                        {STR.cont.seePublicListing}
                      </ButtonLink>
                      {/* Compte suspendu : modifier et changer le statut
                          disparaissent (les actions les refusent de toute
                          façon). Voir et supprimer restent — retirer son
                          propre contenu n'a jamais rien publié. */}
                      {!suspended && (
                        <>
                          <ButtonLink
                            variant="ghost"
                            href={`/cont/animal/${animal.id}/editare`}
                          >
                            {STR.cont.edit}
                          </ButtonLink>
                          <form action={setAnimalStatus}>
                            <input type="hidden" name="id" value={animal.id} />
                            <input
                              type="hidden"
                              name="status"
                              value={
                                animal.status === "ADOPTED"
                                  ? "AVAILABLE"
                                  : "ADOPTED"
                              }
                            />
                            <Button variant="ghost" type="submit">
                              {animal.status === "ADOPTED"
                                ? STR.cont.markAvailable
                                : STR.cont.markAdopted}
                            </Button>
                          </form>
                        </>
                      )}
                      <DeleteAnimalButton id={animal.id} name={name} />
                    </div>
                  </div>
                </Card>
              </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* ——— Déconnexion : une sortie, pas une action — derrière la
          hairline, en bas de page. ——— */}
      <div className="mt-10 border-t border-warm-border pt-4">
        <SignOutButton />
      </div>
    </main>
  );
}
