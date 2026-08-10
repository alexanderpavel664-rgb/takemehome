/**
 * Messages d'erreur en français pour les codes renvoyés par Better Auth.
 * Le fallback reste volontairement vague : ne jamais révéler si une adresse
 * email existe ou non lors d'une connexion ratée.
 */
const MESSAGES: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: "Email ou mot de passe incorrect.",
  INVALID_EMAIL: "Adresse email invalide.",
  PASSWORD_TOO_SHORT: "Le mot de passe doit contenir au moins 8 caractères.",
  PASSWORD_TOO_LONG: "Le mot de passe est trop long (128 caractères maximum).",
  // En 1.6.26 le signup lève USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL ;
  // USER_ALREADY_EXISTS est gardé par prudence (exemples de la doc).
  USER_ALREADY_EXISTS: "Un compte existe déjà avec cette adresse email.",
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL:
    "Un compte existe déjà avec cette adresse email.",
};

export function authErrorMessage(code: string | undefined): string {
  if (code && code in MESSAGES) return MESSAGES[code];
  return "Une erreur est survenue. Réessaie.";
}
