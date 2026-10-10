import { CONTACT_SECTION, type ContactStatus } from "@/lib/contact-status";
import { STR } from "@/lib/strings";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

/**
 * Le bloc « Anunțurile tale nu sunt vizibile pe site » — en haut de /cont
 * tant que le profil est incomplet, avant le formulaire sur
 * /cont/animal/nou et /cont/animal/[id]/editare, et au-dessus de la page
 * /confirmare d'un lien « Încă disponibil » : le moment précis où la
 * personne fait la chose qui va échouer, ou croit l'avoir réussie. Depuis octobre 2026, une annonce
 * sans contact affiché sort des listes publiques (lib/contact-status.ts).
 * Il ne bloque rien — la publication reste possible, et les annonces
 * reviennent d'elles-mêmes dès que le profil est complet.
 *
 * Impossible à manquer par construction : une carte en haut de page, titre
 * en toutes lettres, bordure encre épaissie (le même langage que les autres
 * avertissements du site — jamais la couleur seule, la palette n'a pas de
 * rouge et n'en veut pas), et le chemin de sortie DANS le bloc : un bouton
 * vers la section Date de contact de /cont/profil (ancre CONTACT_SECTION).
 * En outline, pas en plein — le seul bouton plein de chaque écran est déjà
 * pris (La Règle du Bouton Unique).
 *
 * Il dit ce qui se passe et ce qui manque, rien d'autre : ni phrase
 * rassurante, ni justification.
 *
 * Lu par la publiante elle-même : dans l'espace compte, derrière la
 * session ; sur /confirmare, par qui tient le lien signé de son email. Il
 * n'y dit rien que la fiche publique ne montre déjà (pas de contact), et
 * aucune coordonnée. Rend null dès que le profil est complet — le même
 * `contactStatus` qui l'allume l'éteint.
 */
export function ContactWarning({
  status,
  className = "",
}: {
  status: ContactStatus;
  className?: string;
}) {
  if (status.contactable) {
    return null;
  }
  const description = status.missingContact
    ? status.missingConsent
      ? STR.cont.contactWarning.noContactNoConsent
      : STR.cont.contactWarning.noContact
    : STR.cont.contactWarning.noConsent;

  return (
    <Card
      role="status"
      className={`border-[1.5px] border-warm-ink p-4 ${className}`.trim()}
    >
      <h2 className="text-lg font-semibold text-warm-ink">
        {STR.cont.contactWarning.title}
      </h2>
      <p className="mt-1 max-w-[66ch] text-base text-warm-ink">{description}</p>
      <ButtonLink
        variant="outline"
        href={`/cont/profil#${CONTACT_SECTION}`}
        className="mt-3"
      >
        {STR.cont.contactWarning.action}
      </ButtonLink>
    </Card>
  );
}
