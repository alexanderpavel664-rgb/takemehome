/**
 * Les villes telles que la vidéo les affiche : avec les diacritiques
 * roumains, sans les variantes de saisie (« Bucuresti », « BUCURESTI »,
 * « Sector 3 »). Dans la vidéo seulement — le site garde la saisie des
 * publiants. Une ville absente de cette table n'est affichée que si elle
 * s'écrit déjà sans faute possible (aucune lettre qui pourrait porter un
 * diacritique) ; sinon on prend le județ, que lib/counties.ts écrit juste.
 */
const fold = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const CANONICAL = [
  "București",
  "Cluj-Napoca",
  "Florești",
  "Ploiești",
  "Petroșani",
  "Brașov",
  "Bacău",
  "Buzău",
  "Bârlad",
  "Târgu Jiu",
  "Timișoara",
  "Constanța",
  "Iași",
  "Focșani",
  "Bușteni",
  "Băile Herculane",
  "Satu Mare",
  "Baia Mare",
  "Drobeta-Turnu Severin",
  "Câmpenești",
  "Brănești",
  "Berbești",
  "Dăbâca",
  "Sânmărghita",
  "Hunedoara",
  "Sibiu",
  "Craiova",
  "Tulcea",
  "Slatina",
  "Voluntari",
  "Roman",
  "Dej",
  "Brad",
  "Baciu",
  "Berzovia",
  "Eforie Sud",
  "Gura Râului",
  "Josenii Bârgăului",
  "Căiuți",
  "Dănești",
  "Hurezu Mare",
  "Gârdani",
];

const BY_KEY = new Map(CANONICAL.map((c) => [fold(c), c]));
const ALIASES: Record<string, string> = {
  bucharest: "București",
  cluj: "Cluj-Napoca",
  "tg jiu": "Târgu Jiu",
  "targu jiu": "Târgu Jiu",
};

/** La ville corrigée, ou null si on ne sait pas l'écrire juste. */
export function cityName(raw: string | null): string | null {
  if (!raw) return null;
  const key = fold(raw);
  if (/^(bucuresti )?sector \d$/.test(key) || key.startsWith("bucuresti")) return "București";
  return BY_KEY.get(key) ?? ALIASES[key] ?? null;
}
