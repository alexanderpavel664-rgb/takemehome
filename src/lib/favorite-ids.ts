/**
 * Ce que le navigateur (lib/favorites.ts) et l'API (/api/favorite) doivent
 * partager sur les favoris — sans React, pour que la route puisse l'importer.
 */

// Garde-fou : au-delà, les plus anciens sortent, et l'API n'en lit pas plus.
export const MAX_FAVORITES = 100;

// Les ids d'Animal sont des cuid Prisma : « c » suivi de 24 [a-z0-9] (même
// motif que proxy.ts). Tout le reste est ignoré.
const CUID = /^c[a-z0-9]{24}$/;

export function isAnimalId(value: unknown): value is string {
  return typeof value === "string" && CUID.test(value);
}
