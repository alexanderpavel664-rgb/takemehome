import { useSyncExternalStore } from "react";
import { isAnimalId, MAX_FAVORITES } from "@/lib/favorite-ids";

/**
 * Favoris de l'adoptant : une liste d'identifiants d'annonces dans le
 * localStorage du navigateur, rien en base — pas de compte adoptant, pas de
 * donnée personnelle, pas de traitement RGPD de plus. La contrepartie est
 * assumée et dite sur /favorite : ils restent dans CE navigateur.
 *
 * Le plus récent en tête. Les identifiants sont des cuid d'Animal ; tout le
 * reste (valeur trafiquée, ancien format) est ignoré à la lecture. Ce que les
 * annonces sont devenues (adoptées, supprimées) ne se sait qu'en demandant au
 * serveur : c'est /favorite qui le fait.
 *
 * Navigation privée ou stockage bloqué : setItem lève, et la liste vit en
 * mémoire le temps de l'onglet — le cœur fonctionne quand même.
 */
const KEY = "takemehome:favorite";
const CHANGE_EVENT = "takemehome:favorite-change";
const EMPTY: readonly string[] = Object.freeze([]);

let memory: string | null = null;
// Même chaîne brute → même tableau : useSyncExternalStore exige un instantané
// stable, sinon il rend en boucle.
let cached: { raw: string | null; ids: readonly string[] } = { raw: null, ids: EMPTY };

function readRaw(): string | null {
  try {
    return window.localStorage.getItem(KEY) ?? memory;
  } catch {
    return memory;
  }
}

function parse(raw: string | null): readonly string[] {
  if (!raw) return EMPTY;
  try {
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) return EMPTY;
    const ids = value.filter(isAnimalId);
    return Object.freeze([...new Set(ids)].slice(0, MAX_FAVORITES));
  } catch {
    return EMPTY;
  }
}

function getSnapshot(): readonly string[] {
  const raw = readRaw();
  if (raw !== cached.raw) {
    cached = { raw, ids: parse(raw) };
  }
  return cached.ids;
}

function getServerSnapshot(): readonly string[] {
  return EMPTY;
}

function subscribe(onChange: () => void): () => void {
  // « storage » : un autre onglet a changé la liste. L'événement maison :
  // ce même onglet (le navigateur n'émet pas « storage » pour lui-même).
  const onStorage = (event: StorageEvent) => {
    if (event.key === KEY || event.key === null) onChange();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

function write(ids: readonly string[]) {
  const raw = JSON.stringify(ids.slice(0, MAX_FAVORITES));
  try {
    window.localStorage.setItem(KEY, raw);
    memory = null;
  } catch {
    memory = raw;
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/**
 * La liste courante, réactive (même onglet et autres onglets). Vide au rendu
 * serveur et à l'hydratation : le vrai état arrive juste après, sans écart
 * d'hydratation.
 */
export function useFavoriteIds(): readonly string[] {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
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
