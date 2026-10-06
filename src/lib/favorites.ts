import { useSyncExternalStore } from "react";
import type { CardData } from "@/lib/animal-card-data";
import { isAnimalId, MAX_FAVORITES } from "@/lib/favorite-ids";

/**
 * Favoris de l'adoptant : une liste d'identifiants d'annonces dans le
 * localStorage du navigateur, rien en base — pas de compte adoptant, pas de
 * donnée personnelle, pas de traitement RGPD de plus. La contrepartie est
 * assumée et dite sur /favorite : ils restent dans CE navigateur.
 *
 * Le plus récent en tête. Les identifiants sont des cuid d'Animal ; tout le
 * reste (valeur trafiquée, ancien format) est ignoré à la lecture. Ce que les
 * annonces sont devenues (adoptées, inactives, supprimées) ne se sait qu'en
 * demandant au serveur (fetchFavorites) : c'est /favorite qui le montre.
 *
 * Le compteur de l'en-tête ne compte que les favoris disponibles. La
 * dernière réponse du serveur est donc gardée à côté de la liste
 * (STATUS_KEY) : les ids qui ne sont plus disponibles, et l'heure de la
 * réponse. L'en-tête la redemande au plus toutes les 10 minutes
 * (refreshFavoriteStatus) — le rythme des pages județ.
 *
 * Navigation privée ou stockage bloqué : setItem lève, et la liste vit en
 * mémoire le temps de l'onglet — le cœur fonctionne quand même.
 */
const KEY = "takemehome:favorite";
const STATUS_KEY = "takemehome:favorite-status";
const CHANGE_EVENT = "takemehome:favorite-change";
const STATUS_MAX_AGE_MS = 10 * 60 * 1000;
const EMPTY: readonly string[] = Object.freeze([]);

type Status = { at: number; unavailable: readonly string[] };
const NO_STATUS: Status = Object.freeze({ at: 0, unavailable: EMPTY });

const memory = new Map<string, string>();
// Même chaîne brute → même valeur : useSyncExternalStore exige un instantané
// stable, sinon il rend en boucle.
let cached: { raw: string | null; ids: readonly string[] } = { raw: null, ids: EMPTY };
let cachedStatus: { raw: string | null; status: Status } = { raw: null, status: NO_STATUS };

function readRaw(key: string): string | null {
  try {
    return window.localStorage.getItem(key) ?? memory.get(key) ?? null;
  } catch {
    return memory.get(key) ?? null;
  }
}

function writeRaw(key: string, raw: string) {
  try {
    window.localStorage.setItem(key, raw);
    memory.delete(key);
  } catch {
    memory.set(key, raw);
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function parseIds(value: unknown): readonly string[] {
  if (!Array.isArray(value)) return EMPTY;
  const ids = value.filter(isAnimalId);
  return Object.freeze([...new Set(ids)].slice(0, MAX_FAVORITES));
}

function parse(raw: string | null): readonly string[] {
  if (!raw) return EMPTY;
  try {
    return parseIds(JSON.parse(raw));
  } catch {
    return EMPTY;
  }
}

function parseStatus(raw: string | null): Status {
  if (!raw) return NO_STATUS;
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== "object" || value === null) return NO_STATUS;
    const { at, unavailable } = value as Record<string, unknown>;
    return { at: typeof at === "number" ? at : 0, unavailable: parseIds(unavailable) };
  } catch {
    return NO_STATUS;
  }
}

function getSnapshot(): readonly string[] {
  const raw = readRaw(KEY);
  if (raw !== cached.raw) {
    cached = { raw, ids: parse(raw) };
  }
  return cached.ids;
}

function getStatus(): Status {
  const raw = readRaw(STATUS_KEY);
  if (raw !== cachedStatus.raw) {
    cachedStatus = { raw, status: parseStatus(raw) };
  }
  return cachedStatus.status;
}

// Un nombre : stable par nature pour useSyncExternalStore. Un favori ajouté
// depuis la dernière réponse compte — le cœur n'existe que sur un animal
// disponible.
function getAvailableCount(): number {
  const unavailable = new Set(getStatus().unavailable);
  return getSnapshot().filter((id) => !unavailable.has(id)).length;
}

function getServerSnapshot(): readonly string[] {
  return EMPTY;
}

function subscribe(onChange: () => void): () => void {
  // « storage » : un autre onglet a changé la liste. L'événement maison :
  // ce même onglet (le navigateur n'émet pas « storage » pour lui-même).
  const onStorage = (event: StorageEvent) => {
    if (event.key === KEY || event.key === STATUS_KEY || event.key === null) onChange();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

function write(ids: readonly string[]) {
  writeRaw(KEY, JSON.stringify(ids.slice(0, MAX_FAVORITES)));
}

/**
 * La liste courante, réactive (même onglet et autres onglets). Vide au rendu
 * serveur et à l'hydratation : le vrai état arrive juste après, sans écart
 * d'hydratation.
 */
export function useFavoriteIds(): readonly string[] {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** Le nombre de favoris encore disponibles, pour l'en-tête. 0 au rendu serveur. */
export function useAvailableFavoriteCount(): number {
  return useSyncExternalStore(subscribe, getAvailableCount, () => 0);
}

export function toggleFavorite(id: string) {
  const ids = getSnapshot();
  write(ids.includes(id) ? ids.filter((v) => v !== id) : [id, ...ids]);
}

/** Retire d'un coup les annonces qui n'existent plus publiquement. */
export function removeFavorites(gone: readonly string[]) {
  if (gone.length === 0) return;
  const set = new Set(gone);
  write(getSnapshot().filter((id) => !set.has(id)));
}

/** La liste à cet instant, hors rendu (dans un effet, un gestionnaire). */
export function readFavoriteIds(): readonly string[] {
  return getSnapshot();
}

export type FavoriteResponse = { animals: CardData[]; missing: string[] };

/**
 * Ce que les favoris sont devenus, demandé à /api/favorite. La réponse est
 * retenue pour le compteur de l'en-tête : adoptées, inactives et disparues
 * n'y comptent plus.
 */
export async function fetchFavorites(
  ids: readonly string[],
  signal: AbortSignal,
): Promise<FavoriteResponse> {
  const response = await fetch(`/api/favorite?ids=${ids.join(",")}`, { signal });
  if (!response.ok) throw new Error(`favorite ${response.status}`);
  const data = (await response.json()) as FavoriteResponse;
  const unavailable = [
    ...data.animals.filter((card) => card.adopted || card.inactive).map((card) => card.id),
    ...data.missing,
  ];
  writeRaw(STATUS_KEY, JSON.stringify({ at: Date.now(), unavailable }));
  return data;
}

/** Redemande le statut des favoris si la dernière réponse a plus de 10 minutes. */
export async function refreshFavoriteStatus(signal: AbortSignal): Promise<void> {
  const ids = getSnapshot();
  if (ids.length === 0 || Date.now() - getStatus().at < STATUS_MAX_AGE_MS) return;
  await fetchFavorites(ids, signal);
}
