import { logInfo } from "@/lib/log";

/**
 * Envoi d'email par l'API REST de Resend — un POST, pas de SDK : la
 * dépendance n'apporterait qu'un typage pour un seul appel.
 *
 * RIEN N'EST ACTIF SANS LES DEUX VARIABLES : RESEND_API_KEY et EMAIL_FROM
 * (« TakeMeHome <noreply@takemehome.ro> », sur un domaine vérifié chez
 * Resend). Tant qu'elles manquent, isEmailConfigured() vaut false, auth.ts
 * ne branche pas la vérification d'email, et /cont n'affiche pas le bandeau
 * « confirmă-ți adresa ». C'est la seule bascule : les poser en production
 * active l'envoi à la requête suivante. Avant de les poser, voir la liste
 * dans le commentaire emailVerification de auth.ts.
 */
const RESEND_ENDPOINT = "https://api.resend.com/emails";

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

/**
 * Texte brut uniquement : un email transactionnel de trois lignes n'a pas
 * besoin de HTML, et le texte brut passe mieux les filtres d'un domaine tout
 * neuf. Lève en cas d'échec — à l'appelant de décider s'il alerte.
 */
export async function sendEmail({
  to,
  subject,
  text,
}: {
  to: string;
  subject: string;
  text: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) {
    throw new Error("email.not_configured");
  }
  const response = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, text }),
  });
  if (!response.ok) {
    // Le corps de la réponse Resend peut citer l'adresse : il ne sort pas
    // d'ici. Le statut suffit pour diagnostiquer (401 clé, 403 domaine,
    // 422 adresse, 429 quota).
    throw new Error(`email.send_failed: HTTP ${response.status}`);
  }
  // Pas d'adresse dans le log : safeFields occulte les champs nommés
  // « email », on ne lui en donne même pas l'occasion.
  logInfo("email.sent", { subject });
}
