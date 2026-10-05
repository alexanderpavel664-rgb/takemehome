import { animalDisplayName } from "@/lib/animal-display";
import { confirmationUrl } from "@/lib/confirmation-token";
import {
  hideDateAfterReminder,
  longDateRo,
  type DueAnimal,
  type PlannedEmail,
} from "@/lib/confirmations";
import { countyName } from "@/lib/counties";
import { loginHref } from "@/lib/next-path";
import { relativeTimeRo } from "@/lib/relative-time";
import { SITE_URL } from "@/lib/site";
import { STR } from "@/lib/strings";

/**
 * L'email de confirmation : un par publiant, toutes ses annonces dues
 * dedans, chacune avec sa photo, son nom et deux boutons.
 *
 * C'est un message de SERVICE, et il doit le rester pour se passer de
 * consentement (directive 2002/58, art. 13 ; loi roumaine 506/2004,
 * art. 12) : ni réseaux sociaux, ni nouvelles du site, ni invitation à
 * publier. Toute la copie vit dans STR.confirmari.email.
 *
 * ADRESSE NON CONFIRMÉE : aucun bouton. Elle est peut-être mal tapée, et
 * l'email chez un inconnu qui pourrait marquer les animaux comme adoptés
 * d'un clic. L'email dit quoi confirmer et renvoie vers le compte (mot de
 * passe ou Google), seule porte ; aucun lien signé n'est même produit. Le
 * cycle, lui, est le même : sans réponse, l'annonce est masquée.
 *
 * HTML en tableaux et styles en ligne : c'est ce que lisent Gmail, Yahoo
 * et Outlook. Les deux boutons ont le même poids (contour terracotta) :
 * aucun n'est « le bon », et un bouton plein ferait cliquer « Încă
 * disponibil » par réflexe — exactement ce qu'on veut éviter. Le texte
 * brut l'accompagne toujours.
 */

const INK = "#2B2622";
const GRAY = "#6B625A";
const BORDER = "#EAE1D2";
const CREAM = "#F7F3EA";
const IVORY = "#FFFDF8";
const TERRACOTTA = "#C4552F";
const FONT = "Helvetica, Arial, sans-serif";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * La miniature passe par l'optimiseur d'images du site, à la largeur des
 * cartes (640) : même clé de cache que la grille, donc pas de
 * transformation de plus, et ~50 ko au lieu des ~200 ko de l'original.
 */
function thumbnailUrl(photoUrl: string): string {
  return `${SITE_URL}/_next/image?url=${encodeURIComponent(photoUrl)}&w=640&q=75`;
}

type RenderedAnimal = {
  name: string;
  place: string;
  note: string;
  photo: string | null;
  /** null : adresse non confirmée, pas de boutons. */
  links: { available: string; adopted: string } | null;
};

function renderAnimal(
  animal: DueAnimal,
  now: Date,
  withButtons: boolean,
): RenderedAnimal {
  const s = STR.confirmari.email;
  // Une seule note, la plus utile : la date de masquage d'une relance, ce
  // qu'a dit un visiteur, sinon l'ancienneté de la dernière mise à jour.
  const note =
    animal.stage === "reminder"
      ? s.noteReminder(longDateRo(hideDateAfterReminder(now)))
      : animal.requested
        ? s.noteRequested(animal.count > 1)
        : s.noteUpdated(relativeTimeRo(animal.updatedAt, now));
  return {
    name: animalDisplayName(animal),
    place: [animal.city?.trim(), countyName(animal.county)]
      .filter(Boolean)
      .join(", "),
    note,
    photo: animal.photoUrl ? thumbnailUrl(animal.photoUrl) : null,
    links: withButtons
      ? {
          available: confirmationUrl(animal.id, "available", now),
          adopted: confirmationUrl(animal.id, "adopted", now),
        }
      : null,
  };
}

function button(href: string, label: string): string {
  return (
    `<a href="${escapeHtml(href)}" style="display:inline-block;margin:0 8px 8px 0;` +
    `padding:12px 20px;border:2px solid ${TERRACOTTA};border-radius:20px;` +
    `color:${TERRACOTTA};font-family:${FONT};font-size:19px;font-weight:600;` +
    `line-height:22px;text-decoration:none">${escapeHtml(label)}</a>`
  );
}

function animalHtml(animal: RenderedAnimal): string {
  const s = STR.confirmari.email;
  const photo = animal.photo
    ? `<img src="${escapeHtml(animal.photo)}" width="120" alt="${escapeHtml(
        STR.animal.photoAlt(animal.name),
      )}" style="display:block;width:120px;height:auto;border:1px solid ${BORDER};border-radius:20px">`
    : `<div style="width:120px;height:90px;background:${CREAM};border:1px solid ${BORDER};border-radius:20px"></div>`;
  // Les boutons sur leur propre rangée, pleine largeur : à côté d'une
  // photo de 120 px, deux libellés de 19 px déborderaient d'un téléphone.
  return `
<tr><td style="padding:16px 0 8px;border-top:1px solid ${BORDER}">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
    <td width="120" valign="top" style="padding-right:16px">${photo}</td>
    <td valign="top" style="font-family:${FONT};color:${INK}">
      <p style="margin:0;font-size:18px;line-height:24px;font-weight:600">${escapeHtml(animal.name)}</p>
      <p style="margin:2px 0 0;font-size:14px;line-height:20px;color:${GRAY}">${escapeHtml(animal.place)}</p>
      <p style="margin:8px 0 0;font-size:14px;line-height:20px">${escapeHtml(animal.note)}</p>
    </td>
  </tr>${
    animal.links
      ? `<tr>
    <td colspan="2" style="padding-top:12px">${button(animal.links.available, s.available)}${button(animal.links.adopted, s.adopted)}</td>
  </tr>`
      : ""
  }</table>
</td></tr>`;
}

function paragraph(text: string, color = INK): string {
  return `<p style="margin:0 0 16px;font-family:${FONT};font-size:16px;line-height:24px;color:${color}">${escapeHtml(text)}</p>`;
}

export function renderConfirmationEmail(
  email: PlannedEmail,
  now: Date,
): { subject: string; text: string; html: string } {
  const s = STR.confirmari.email;
  const withButtons = email.user.emailVerified;
  const animals = email.animals.map((animal) =>
    renderAnimal(animal, now, withButtons),
  );
  const accountUrl = `${SITE_URL}/cont`;
  const loginUrl = `${SITE_URL}${loginHref("/cont")}`;
  const subject = s.subject(animals.length, email.reminder);

  const text = [
    s.greeting(email.user.name),
    s.intro(animals.length),
    ...animals.map((a) =>
      [
        `${a.name} · ${a.place}`,
        a.note,
        ...(a.links
          ? [
              `${s.available}: ${a.links.available}`,
              `${s.adopted}: ${a.links.adopted}`,
            ]
          : []),
      ].join("\n"),
    ),
    withButtons ? s.links : `${s.unverified}\n${s.loginToConfirm}: ${loginUrl}`,
    s.process,
    `${s.why}\n${accountUrl}`,
    s.signature,
  ].join("\n\n");

  const html = `<!doctype html>
<html lang="ro">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;padding:0;background:${CREAM}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${CREAM}"><tr><td align="center" style="padding:24px 12px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background:${IVORY};border:1px solid ${BORDER};border-radius:20px">
    <tr><td style="padding:24px 20px 8px">
      ${paragraph(s.greeting(email.user.name))}
      ${paragraph(s.intro(animals.length))}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${animals.map(animalHtml).join("")}</table>
    </td></tr>
    <tr><td style="padding:8px 20px 8px;border-top:1px solid ${BORDER}">
      <div style="height:16px"></div>
      ${
        withButtons
          ? paragraph(s.links)
          : `${paragraph(s.unverified)}<p style="margin:0 0 16px">${button(loginUrl, s.loginToConfirm)}</p>`
      }
      ${paragraph(s.process)}
      <p style="margin:0 0 16px;font-family:${FONT};font-size:14px;line-height:20px;color:${GRAY}">${escapeHtml(s.why)} <a href="${escapeHtml(accountUrl)}" style="color:${INK}">${escapeHtml(accountUrl.replace(/^https?:\/\//, ""))}</a></p>
      ${paragraph(s.signature, GRAY)}
    </td></tr>
  </table>
</td></tr></table>
</body>
</html>`;

  return { subject, text, html };
}
