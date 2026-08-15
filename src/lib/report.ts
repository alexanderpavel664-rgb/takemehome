import * as Sentry from "@sentry/nextjs";
import { logError, safeFields, type LogFields } from "@/lib/log";

/**
 * Signale une erreur rattrapée : ligne JSON dans les logs Vercel ET issue
 * Sentry (donc email). À réserver aux échecs qu'on veut voir arriver, pas
 * aux erreurs de saisie de l'utilisateur — un formulaire mal rempli n'est
 * pas une panne.
 *
 * SERVEUR UNIQUEMENT : importe le SDK Node. Ne jamais importer ce module
 * depuis un composant client, ce serait faire entrer Sentry dans le bundle
 * navigateur — voir src/lib/client-report.ts pour le côté navigateur.
 *
 * `await` volontaire : sur Vercel la fonction peut être gelée dès la réponse
 * renvoyée, et l'événement partirait dans le vide. Le flush est plafonné à
 * deux secondes et ne s'exécute que sur un chemin d'erreur, déjà rare.
 */
export async function reportError(
  event: string,
  error: unknown,
  fields?: LogFields,
): Promise<void> {
  logError(event, error, fields);

  Sentry.captureException(error, {
    // Le tag rend l'événement filtrable dans Sentry et sert de règle
    // d'alerte : `event:animal.save_failed` mérite un email immédiat.
    tags: { event },
    extra: safeFields(fields),
  });

  // Un échec d'envoi ne doit jamais casser la requête en cours.
  await Sentry.flush(2000).catch(() => false);
}
