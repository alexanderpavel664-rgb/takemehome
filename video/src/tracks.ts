/**
 * La piste de la vidéo : Soul Damage, Diego Nava (Mixkit, voir
 * LICENCES.md), retenue le 27 octobre 2026 après comparaison de six
 * pistes. La même chaque mois.
 *
 * public/audio/music-soul-damage.wav est préparé par
 * scripts/prepare-audio.mjs (même grille) : onze mesures depuis un début de
 * phrase, puis le fondu jusqu'au silence. La vidéo dure onze mesures et un
 * temps, arrondis à l'image supérieure — la même formule des deux côtés.
 */
export type TrackId = "soul-damage";

export type Track = { title: string; author: string; bpm: number };

export const TRACKS: Record<TrackId, Track> = {
  "soul-damage": { title: "Soul Damage", author: "Diego Nava", bpm: 114 },
};

export const CHOSEN: TrackId = "soul-damage";

export const BARS = 11;

/**
 * Nombre d'images de la vidéo : onze mesures et un temps — le fondu de la
 * musique commence quand le logo a fini d'apparaître et dure une mesure —,
 * arrondies à l'image supérieure. Même formule que scripts/prepare-audio.mjs.
 */
export const trackFrames = (id: TrackId, fps: number) => Math.ceil(((BARS * 4 + 1) * 60 * fps) / TRACKS[id].bpm - 1e-6);

export const musicFile = (id: TrackId) => `audio/music-${id}.wav`;
