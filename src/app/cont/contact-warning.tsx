import type { ContactStatus } from "@/lib/contact-status";
import { STR } from "@/lib/strings";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

/**
 * Le bloc « Anunțurile tale nu pot fi contactate » — en haut de /cont tant
 * que le profil est incomplet, et avant le formulaire sur /cont/animal/nou
 * et /cont/animal/[id]/editare : le moment précis où la personne fait la
 * chose qui va échouer. Il ne bloque rien — la publication reste possible.
 *
 * Impossible à manquer par construction : une carte en haut de page, titre
 * en toutes lettres, bordure encre épaissie (le même langage que les autres
 * avertissements du site — jamais la couleur seule, la palette n'a pas de
 * rouge et n'en veut pas), et le chemin de sortie DANS le bloc : un bouton
 * vers /cont/profil. En outline, pas en plein — le seul bouton plein de
 * chaque écran est déjà pris (La Règle du Bouton Unique).
 *
 * Il dit ce qui se passe et ce qui manque, rien d'autre : ni phrase
 * rassurante, ni justification.
 *
 * Ne s'affiche que dans l'espace compte, derrière la session : aucun
 * visiteur public ne lit jamais ceci. Rend null dès que le profil est
 * complet — le même `contactStatus` qui l'allume l'éteint.
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
      <ButtonLink variant="outline" href="/cont/profil" className="mt-3">
        {STR.cont.contactWarning.action}
      </ButtonLink>
    </Card>
  );
}
