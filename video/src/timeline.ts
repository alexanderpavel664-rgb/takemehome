/**
 * Le récit en onze mesures, sur la grille de la piste (à 125 BPM : mesure
 * 1,92 s, temps 0,48 s, double-croche 0,12 s). La grille vient de la
 * musique préparée (scripts/prepare-audio.mjs) : la vidéo commence sur le
 * premier temps d'une phrase de la piste.
 *
 *  1      photo 1, la question — déjà là à la première image ; pas de beat
 *  2      le beat entre : un adopté, « Unele își găsesc o casă. », la pastille
 *  3–5    les adoptés, un par demi-mesure ; prénoms et pastille en mesure 3
 *         seulement ; le compteur, seul grand moment, mesures 4 et 5
 *  6      respiration : le beat s'efface, crème, « Altele încă își așteaptă familia. »
 *  7–8    le beat revient : trois disponibles
 *  9      la rafale : dix photos d'adoptés de plus en plus vite (croches,
 *         puis triolets de croches ; 6 photos par seconde au plus), qui se
 *         fond peu à peu dans le crème
 *  10     « Poate ești tu. »
 *  11     le logo et takemehome.ro ; une fois le logo apparu (un temps),
 *         seule la musique s'éteint en fondu, sur une mesure — l'image reste
 *         nette jusqu'à la dernière image
 *
 * Calage :
 *  - chaque changement de photo tombe sur un temps (dans la rafale : sur une
 *    croche ou un triolet de croches) ; les grands moments
 *    (chaque phrase, le début du défilé, le retour du beat, le logo) sur
 *    un premier temps de mesure ;
 *  - les accents de Soul Damage (mesurés sur le fichier préparé) : l'accord
 *    du 3e temps de chaque mesure (+10 à +20 dB dans le médium) et la
 *    caisse sur les 2e et 4e temps portent les entrées secondaires —
 *    « o casă. » et le 2e prénom sur le 3e temps, la pastille sur le 4e,
 *    « ești tu. » sur le 3e temps de la mesure 10 ; jamais un effet visuel.
 *  - tout instant est arrondi à l'image d'avant (`snap`) : une image en
 *    avance sur le son passe inaperçue, une image en retard se remarque.
 *
 * Chaque phrase reste au moins une mesure à l'écran. Les sorties sont
 * données par l'instant où le texte doit avoir disparu (`by`).
 */
export type Slot = { start: number; end: number };

export const BEATS_PER_BAR = 4;

export const buildTimeline = (seconds: number, fps: number, bpm: number) => {
  const beat = 60 / bpm;
  const bar = BEATS_PER_BAR * beat;
  const sixteenth = beat / 4;
  /** Arrondi à l'image d'avant. */
  const snap = (t: number) => Math.floor(t * fps + 1e-6) / fps;
  /** Le k-ième temps (1 à 4) de la mesure n (1 à 11), éventuellement plus quelques doubles-croches. */
  const at = (barNumber: number, beatNumber = 1, plus16 = 0) =>
    snap((barNumber - 1) * bar + (beatNumber - 1) * beat + plus16 * sixteenth);

  // Adoptés : un dans la mesure 2, puis un par demi-mesure, mesures 3 à 5.
  const scroll: Slot[] = [];
  for (let i = 0; i < 6; i++) scroll.push({ start: at(3 + Math.floor(i / 2), 1 + 2 * (i % 2)), end: at(3 + Math.floor((i + 1) / 2), 1 + 2 * ((i + 1) % 2)) });

  // Disponibles : trois temps, trois temps, deux temps.
  const available: Slot[] = [
    { start: at(7), end: at(7, 4) },
    { start: at(7, 4), end: at(8, 3) },
    { start: at(8, 3), end: at(9) },
  ];

  // Rafale : dix photos sur la mesure 9, calées sur la musique et de plus
  // en plus vite — des croches sur les temps 1 et 2 (à 114 BPM : 3,8 photos
  // par seconde), puis des triolets de croches sur les temps 3 et 4 (5,7).
  // Jamais plus de 6 photos par seconde : au plus 3 flashs par seconde au
  // sens WCAG, quelles que soient les photos. Chaque coupe est arrondie à
  // l'image d'avant ; la dernière photo tient jusqu'au premier temps de la
  // mesure 10.
  const MAX_PHOTOS_PER_SECOND = 6;
  const subdivisions = [2, 2, 3, 3]; // par temps de la mesure 9
  const cutTimes: number[] = [];
  subdivisions.forEach((n, b) => {
    for (let i = 0; i < n; i++) cutTimes.push(snap(8 * bar + b * beat + (i * beat) / n));
  });
  const montage: Slot[] = cutTimes.map((start, i) => ({ start, end: cutTimes[i + 1] ?? at(10) }));
  if (montage.some((m) => m.end - m.start < 1 / MAX_PHOTOS_PER_SECOND - 1.5 / fps)) {
    throw new Error("Rafale trop rapide : plus de 6 photos par seconde.");
  }

  return {
    seconds,
    bar,
    beat,
    at,
    snap,
    question: { by: at(2) },
    answer: { line1: at(2), line2: at(2, 3), by: at(3) },
    /**
     * La pastille accompagne les prénoms et sort avec eux : pendant le
     * compteur (mesures 4 et 5), il est seul — il dit déjà « au fost deja
     * adoptate. ».
     */
    pill: { in: at(2, 4), by: at(4) },
    scroll,
    /** Les prénoms s'arrêtent au compteur ; le 2e entre sur l'accord du 3e temps, avec sa photo. */
    names: [at(3), at(3, 3)],
    namesUntil: at(4),
    /** Le compte dure une mesure et ralentit : le dernier chiffre tombe sur le premier temps de la mesure 5. */
    counter: { in: at(4), countUntil: at(5), line2: at(5), by: at(6) },
    breath: { cream: at(6), text: at(6), by: at(7) },
    available,
    montage,
    /**
     * Le voile crème de la rafale : il part du 2e temps de la mesure 9 et
     * monte en laissant la rafale visible ; sur le 4e temps, il se ferme
     * pendant que la rafale continue de couper au même rythme (triolets),
     * jusqu'à être plein au premier temps de la mesure 10. Les dernières
     * coupes disparaissent sous le voile : voulu.
     */
    veil: { from: at(9, 2), closeFrom: at(9, 4), to: at(10) },
    appeal: { line1: at(10), line2: at(10, 3) },
    /** Le logo entre sur le premier temps de la mesure 11 et reste net jusqu'à la fin. */
    logo: at(11),
    /** Toutes les coupes de photo, pour le contrôle du calage. */
    cuts: [at(2), ...scroll.map((s) => s.start), at(6), ...available.map((s) => s.start), ...montage.map((s) => s.start)],
  };
};

export type Timeline = ReturnType<typeof buildTimeline>;
