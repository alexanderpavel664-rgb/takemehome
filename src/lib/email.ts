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
 *
 * Forfait Resend Free (vérifié le 5 octobre 2026) : 100 emails par jour et
 * 3 000 par mois, TOUS envois confondus. Les emails de compte (confirmation
 * d'adresse, mot de passe) et ceux de confirmation des annonces puisent
 * dans le même quota — voir DAILY_EMAIL_CAP dans lib/confirmations.ts.
 */
const RESEND_ENDPOINT = "https://api.resend.com/emails";

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

/** Refus de Resend, avec son statut HTTP : 429 = quota ou débit dépassé. */
export class EmailSendError extends Error {
  constructor(readonly status: number) {
    super(`email.send_failed: HTTP ${status}`);
    this.name = "EmailSendError";
  }
}

/**
 * Texte brut par défaut : un email transactionnel de trois lignes n'a pas
 * besoin de HTML, et le texte brut passe mieux les filtres d'un domaine tout
 * neuf. `html` s'ajoute au texte, il ne le remplace jamais : le texte reste
 * la version que lisent les clients qui bloquent le HTML.
 *
 * `idempotencyKey` : Resend ne renvoie pas un email déjà parti sous la même
 * clé dans les 24 heures — la protection contre une tâche planifiée que
 * Vercel déclencherait deux fois.
 *
 * Lève en cas d'échec — à l'appelant de décider s'il alerte.
 */
export async function sendEmail({
  to,
  subject,
  text,
  html,
  idempotencyKey,
}: {
  to: string;
  subject: string;
  text: string;
  html?: string;
  idempotencyKey?: string;
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
      ...(idempotencyKey && { "Idempotency-Key": idempotencyKey }),
    },
    body: JSON.stringify({ from, to, subject, text, ...(html && { html }) }),
  });
  if (!response.ok) {
    // Le corps de la réponse Resend peut citer l'adresse : il ne sort pas
    // d'ici. Le statut suffit pour diagnostiquer (401 clé, 403 domaine,
    // 409 clé d'idempotence, 422 adresse, 429 quota).
    throw new EmailSendError(response.status);
  }
  // Pas d'adresse dans le log : safeFields occulte les champs nommés
  // « email », on ne lui en donne même pas l'occasion.
  logInfo("email.sent", { subject });
}
