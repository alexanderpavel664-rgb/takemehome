import { interpolate } from "remotion";
import { CASCADE, type Register } from "./brand";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** 0 → 1 entre `at` et `at + dur` (secondes), sur `easing`. */
export function progress(frame: number, fps: number, at: number, dur: number, easing: (t: number) => number): number {
  return interpolate(frame, [at * fps, (at + dur) * fps], [0, 1], { ...clamp, easing });
}

/** Un nombre entre 0 et 1, toujours le même pour une même clé. */
export function hash01(key: string): number {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 100000) / 100000;
}

const within = ([lo, hi]: readonly [number, number], u: number) => lo + (hi - lo) * u;

/** Une occurrence : durées et amplitude propres, toujours dans les bornes du registre. */
export type Motion = { r: Register; inDur: number; outDur: number; amplitude: number; cascade: number };

/**
 * Rien de parfaitement identique d'une occurrence à l'autre : chaque texte
 * tire de sa clé une durée d'entrée et de sortie dans les bornes de son
 * registre (la sortie reste plus rapide que l'entrée), une amplitude à
 * ±12 % et une cascade de 60 à 80 ms.
 */
export function vary(r: Register, key: string): Motion {
  const inDur = within(r.inDur, hash01(`${key}:in`));
  const outDur = Math.min(within(r.outDur, hash01(`${key}:out`)), inDur * 0.75);
  return {
    r,
    inDur,
    outDur,
    amplitude: r.amplitude * (0.88 + 0.24 * hash01(`${key}:amp`)),
    cascade: within(CASCADE, hash01(`${key}:cascade`)),
  };
}

/**
 * Le mouvement d'un texte : il monte en apparaissant, et repart vers le
 * haut, plus vite, en disparaissant. `outBy` : l'instant où il doit avoir
 * disparu — sa sortie commence donc `outDur` plus tôt. `present` : déjà
 * entré, comme à la première image de la vidéo.
 */
export function textMotion(
  frame: number,
  fps: number,
  m: Motion,
  inAt: number,
  outBy?: number,
  present = false,
): { opacity: number; translate: string } {
  const i = present ? 1 : progress(frame, fps, inAt, m.inDur, m.r.in);
  const o = outBy === undefined ? 0 : progress(frame, fps, outBy - m.outDur, m.outDur, m.r.out);
  return {
    opacity: i * (1 - o),
    translate: `0px ${m.amplitude * (1 - i) - m.amplitude * o}px`,
  };
}
