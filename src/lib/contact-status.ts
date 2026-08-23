/**
 * Un animal est joignable si, et seulement si, la fiche publique peut
 * afficher au moins un bouton de contact — ce que décide la page
 * /animal/[id] : un téléphone OU un email public, ET le consentement à
 * leur affichage. Cette fonction est la même règle, lue depuis le compte,
 * pour que /cont, /cont/animal/nou et les fiches de la publiante disent
 * exactement ce que le public voit — jamais autre chose.
 *
 * Deux pièges silencieux, deux remèdes : « complète tes coordonnées » à
 * quelqu'un qui les a déjà remplies l'enverrait chercher un problème qui
 * n'existe pas. D'où les deux drapeaux séparés, et non un seul booléen.
 */
export type ContactStatus = {
  /** Au moins un bouton de contact s'affiche sur les fiches publiques. */
  contactable: boolean;
  /** Ni téléphone ni email public. */
  missingContact: boolean;
  /** La case d'affichage public n'est pas cochée. */
  missingConsent: boolean;
};

export function contactStatus(user: {
  phone?: string | null;
  publicEmail?: string | null;
  contactConsent?: boolean | null;
}): ContactStatus {
  const missingContact = !user.phone?.trim() && !user.publicEmail?.trim();
  // `?? false` : le champ n'existe pas sur les sessions ouvertes avant la
  // migration du consentement — absent vaut non donné, jamais l'inverse.
  const missingConsent = !(user.contactConsent ?? false);
  return {
    contactable: !missingContact && !missingConsent,
    missingContact,
    missingConsent,
  };
}
