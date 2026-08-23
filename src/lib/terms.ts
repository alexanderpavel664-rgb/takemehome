import { TERMS_VERSION } from "@/lib/legal";

/**
 * Le cookie qui porte la case cochée sur /inregistrare jusqu'à la création
 * du compte. Il existe parce que le compte n'existe pas encore au moment du
 * clic, et que le chemin Google passe par un aller-retour hors du site :
 * aucun corps de requête ne traverse l'OAuth. Le hook user.create.before
 * (auth.ts) le lit — pour l'inscription par email comme pour Google — et
 * inscrit termsAcceptedAt + termsVersion sur la ligne User qui naît.
 *
 * Sa valeur est la version acceptée, rien d'autre. Non signé, posé par le
 * navigateur : le forger ne permet que d'accepter les conditions en son
 * propre nom — il n'ouvre aucun droit. Quinze minutes : le temps d'un
 * aller-retour Google, pas plus. Listé dans /confidentialitate, point 5.
 */
export const TERMS_COOKIE = "tmh_terms";
const TERMS_COOKIE_MAX_AGE = 15 * 60;

/** Côté navigateur, juste avant signUp.email ou signIn.social. */
export function rememberTermsAcceptance(): void {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${TERMS_COOKIE}=${TERMS_VERSION}; Path=/; Max-Age=${TERMS_COOKIE_MAX_AGE}; SameSite=Lax${secure}`;
}

/** La version lue dans le cookie vaut-elle une acceptation courante ? */
export function isAcceptedVersion(value: string | null | undefined): boolean {
  return value === TERMS_VERSION;
}
