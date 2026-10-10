import type { Prisma } from "@/generated/prisma/client";

/**
 * Un animal est joignable si, et seulement si, la fiche publique peut
 * afficher au moins un bouton de contact — ce que décide la page
 * /animal/[id] : un téléphone OU un email public, ET le consentement à
 * leur affichage. Cette fonction est la même règle, lue depuis le compte,
 * pour que /cont, /cont/animal/nou et les fiches de la publiante disent
 * exactement ce que le public voit — jamais autre chose.
 *
 * Depuis octobre 2026, la règle décide aussi de la VISIBILITÉ : une annonce
 * injoignable sort des listes publiques (CONTACTABLE_USER, plus bas), et sa
 * fiche, toujours accessible par lien, répond noindex (proxy.ts) avec un
 * message à la place du contact. Rien n'est écrit en base : dès que le
 * profil est complet, la même règle la remet partout.
 *
 * Deux pièges silencieux, deux remèdes : « complète tes coordonnées » à
 * quelqu'un qui les a déjà remplies l'enverrait chercher un problème qui
 * n'existe pas. D'où les deux drapeaux séparés, et non un seul booléen.
 */
/** L'ancre de la section Date de contact de /cont/profil. */
export const CONTACT_SECTION = "date-de-contact";

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

/**
 * La même règle, en clause Prisma sur le publiant : ce que les listes
 * publiques (/animale, accueil, pages județ, sitemap) ajoutent à leur
 * filtre. Une colonne vide vaut NULL ou '' (le formulaire de profil envoie
 * '' pour un champ effacé) : les deux sont exclus.
 *
 * Seul écart possible avec contactStatus : Prisma ne sait pas faire trim().
 * Une valeur faite seulement d'espaces passerait ici et pas là. Le
 * formulaire de profil trime avant d'écrire, et la production n'en
 * comptait aucune le 10 oct. 2026 — n'y arrive qu'une requête forgée à la
 * main par la titulaire du compte, sur ses propres annonces.
 */
export const CONTACTABLE_USER = {
  contactConsent: true,
  OR: [
    { AND: [{ phone: { not: null } }, { phone: { not: "" } }] },
    { AND: [{ publicEmail: { not: null } }, { publicEmail: { not: "" } }] },
  ],
} satisfies Prisma.UserWhereInput;
