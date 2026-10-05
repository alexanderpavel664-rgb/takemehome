import { createHmac, hkdfSync, timingSafeEqual } from "node:crypto";
import { SITE_URL } from "@/lib/site";

/**
 * Les liens des emails de confirmation : ils marchent SANS session, donc
 * c'est le lien lui-même qui porte l'autorisation. Chacun vaut pour UN
 * animal et UNE action, et expire. Il ne permet rien d'autre que de passer
 * cet animal en AVAILABLE ou en ADOPTED (et, après ADOPTED, de répondre à la
 * question facultative) : ni lecture du compte, ni modification du reste de
 * l'annonce.
 *
 * Format : <animalId>.<d|a>.<expiration en secondes, base 36>.<HMAC>
 * Pas de JSON ni de base64 du contenu : tout est déjà sûr dans une URL, et
 * le lien reste lisible dans un journal d'erreur sans rien révéler de plus
 * que l'id de l'annonce, qui est public.
 *
 * Clé : dérivée de BETTER_AUTH_SECRET par HKDF avec une étiquette propre à
 * cet usage — pas de secret de plus à poser sur Vercel, et aucune signature
 * produite ici ne peut servir ailleurs (ni l'inverse). Changer le secret
 * d'auth invalide les liens en circulation : le publiant passe alors par
 * son compte, et la tâche du lendemain n'en dépend pas.
 */

export type ConfirmAction = "available" | "adopted";

const ACTION_CODE: Record<ConfirmAction, string> = {
  available: "d",
  adopted: "a",
};

/**
 * 30 jours : le premier email doit encore marcher après la relance
 * (+14 j) et quelques jours après le masquage (+28 j) — un clic sur
 * « Încă disponibil » réactive alors l'annonce.
 */
export const CONFIRM_LINK_TTL_DAYS = 30;

const DAY_MS = 86_400_000;
const ID = /^c[a-z0-9]{24}$/;

let cachedKey: Buffer | null = null;

function key(): Buffer {
  if (cachedKey) {
    return cachedKey;
  }
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret) {
    throw new Error("confirmation.secret_missing");
  }
  cachedKey = Buffer.from(
    hkdfSync("sha256", secret, "", "takemehome:confirmare:v1", 32),
  );
  return cachedKey;
}

function sign(payload: string): string {
  return createHmac("sha256", key()).update(payload).digest("base64url");
}

export function confirmationToken(
  animalId: string,
  action: ConfirmAction,
  now: Date = new Date(),
): string {
  const expires = Math.floor(
    (now.getTime() + CONFIRM_LINK_TTL_DAYS * DAY_MS) / 1000,
  ).toString(36);
  const payload = `${animalId}.${ACTION_CODE[action]}.${expires}`;
  return `${payload}.${sign(payload)}`;
}

export function confirmationUrl(
  animalId: string,
  action: ConfirmAction,
  now: Date = new Date(),
): string {
  return `${SITE_URL}/confirmare/${confirmationToken(animalId, action, now)}`;
}

export type VerifiedToken =
  | { ok: true; animalId: string; action: ConfirmAction }
  | { ok: false; reason: "invalid" | "expired" };

export function verifyConfirmationToken(
  token: string,
  now: Date = new Date(),
): VerifiedToken {
  const parts = token.split(".");
  if (parts.length !== 4) {
    return { ok: false, reason: "invalid" };
  }
  const [animalId, code, expires, signature] = parts;
  const action = (Object.keys(ACTION_CODE) as ConfirmAction[]).find(
    (a) => ACTION_CODE[a] === code,
  );
  if (!ID.test(animalId) || !action || !/^[0-9a-z]{1,10}$/.test(expires)) {
    return { ok: false, reason: "invalid" };
  }
  const expected = Buffer.from(sign(`${animalId}.${code}.${expires}`));
  const given = Buffer.from(signature);
  // La signature d'abord, l'expiration ensuite : un lien forgé ne doit pas
  // apprendre qu'il « a expiré ».
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) {
    return { ok: false, reason: "invalid" };
  }
  if (Number.parseInt(expires, 36) * 1000 < now.getTime()) {
    return { ok: false, reason: "expired" };
  }
  return { ok: true, animalId, action };
}
