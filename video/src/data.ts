import exported from "../data/export.json";
import selection from "../data/selection.json";
import { cityName } from "./places";

/**
 * Les données de la vidéo : uniquement data/export.json (écrit par
 * scripts/export-video.mts, lecture seule de la production) et
 * data/selection.json (scripts/select-photos.mjs : photos revues,
 * étalonnées). La vidéo ne lit jamais la base.
 */
type ExportedAnimal = (typeof exported.adopted)[number];

/** Animaux adoptés, fratries comptées par tête ; hors annonces masquées, de démonstration ou de comptes suspendus. */
export const COUNTER = exported.counter.adoptedAnimals;

const animals = new Map<string, ExportedAnimal>([...exported.adopted, ...exported.available].map((a) => [a.id, a]));

/**
 * Comme la fiche du site : « ville, județ » (« Baciu, Cluj »), le județ
 * seul sans ville. La ville corrigée (places.ts) ; pas de répétition quand
 * ville et județ portent le même nom (« Iași », pas « Iași, Iași »).
 */
const place = (a: ExportedAnimal) => {
  const city = cityName(a.city);
  return !city || city === a.county ? a.county : `${city}, ${a.county}`;
};

export type CastMember = { name: string; place: string; file: string; seed: string };

const member = (e: { animalId: string; photoId: string; file: string } | null): CastMember => {
  const a = e ? animals.get(e.animalId) : undefined;
  return { name: a?.name.trim() ?? "?", place: a ? place(a) : "?", file: e?.file ?? "", seed: e?.photoId ?? "?" };
};

/** La distribution du mois : photo 1, l'adopté de la réponse, six adoptés, trois disponibles, la rafale. */
export const CAST = {
  photo1: member(selection.photo1),
  answer: member(selection.answer),
  scroll: selection.scroll.map(member),
  available: selection.available.map(member),
  /** La rafale de la mesure 9 : des adoptés, sans texte. */
  montage: selection.montage.map(member),
};
