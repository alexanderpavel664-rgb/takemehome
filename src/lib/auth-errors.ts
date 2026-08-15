import { STR } from "@/lib/strings";

/**
 * Messages d'erreur pour les codes renvoyés par Better Auth — les textes
 * vivent dans strings.ts. Le fallback reste volontairement vague : ne jamais
 * révéler si une adresse email existe ou non lors d'une connexion ratée.
 */
const MESSAGES: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: STR.auth.errors.INVALID_EMAIL_OR_PASSWORD,
  INVALID_EMAIL: STR.auth.errors.INVALID_EMAIL,
  PASSWORD_TOO_SHORT: STR.auth.errors.PASSWORD_TOO_SHORT,
  PASSWORD_TOO_LONG: STR.auth.errors.PASSWORD_TOO_LONG,
  // En 1.6.26 le signup lève USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL ;
  // USER_ALREADY_EXISTS est gardé par prudence (exemples de la doc).
  USER_ALREADY_EXISTS: STR.auth.errors.USER_ALREADY_EXISTS,
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL:
    STR.auth.errors.USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL,
};

export function authErrorMessage(code: string | undefined): string {
  if (code && code in MESSAGES) return MESSAGES[code];
  return STR.auth.errors.fallback;
}
