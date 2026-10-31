/**
 * Le nom saisi dans le formulaire d'annonce ressemble-t-il à autre chose
 * qu'au nom d'un animal ? Deux erreurs récurrentes en production : le nom de
 * la personne (le navigateur remplit tout champ `name`, et plusieurs
 * publiantes l'ont gardé) et un bouche-trou (« Nu are », « De adoptat »)
 * écrit à la place de la case « Nu are nume ».
 *
 * Un AVERTISSEMENT, jamais un refus : Tina peut s'appeler comme sa
 * propriétaire. Aucune de ces règles ne doit donc servir à bloquer l'envoi.
 */

export type AnimalNameWarning = "account" | "placeholder";

// Sans diacritiques (Fetița = fetita), en minuscules, et toute ponctuation
// réduite à une espace : « Nu are. » et « nu  are » sont le même mot.
function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

// Sur le texte normalisé. Liste fermée : un mot de plus ici, c'est un nom
// d'animal de plus sur lequel on se trompe.
const PLACEHOLDER =
  /^(n a|nu (are|au)( inca)?( nume)?|fara( nume)?|nu (se )?sti[eum]|necunoscut|nimic|anonim|de adoptat|(spre |pentru )?adoptie)$/;

export function animalNameWarning(
  name: string,
  accountName: string,
): AnimalNameWarning | null {
  const normalized = normalize(name);
  // Rien d'autre que de la ponctuation (« - », « ? »), ou une seule lettre.
  if (name.trim() && normalized.length < 2) {
    return "placeholder";
  }
  if (PLACEHOLDER.test(normalized)) {
    return "placeholder";
  }
  if (normalized.length < 3) {
    return null;
  }
  // Chaque mot saisi est un mot du nom du compte : l'ordre inversé et le
  // prénom seul sont couverts, un nom simplement commencé ne l'est pas
  // (« Mi » tapé par Mihaela ne déclenche rien).
  const account = new Set(normalize(accountName).split(" "));
  return normalized.split(" ").every((word) => account.has(word))
    ? "account"
    : null;
}
