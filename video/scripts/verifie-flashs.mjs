/**
 * Compte les flashs d'une vidéo au sens des WCAG 2.2 (critère 2.3.1,
 * « Three Flashes or Below Threshold »), par la mesure.
 *
 *   node scripts/verifie-flashs.mjs out/takemehome-adoptii.mp4 [...]
 *
 * Définitions appliquées :
 * - flash général : une paire de changements opposés de la luminance
 *   relative d'au moins 0,10, l'image la plus sombre de chaque changement
 *   sous 0,80 ;
 * - flash rouge : une paire de transitions opposées vers ou depuis un rouge
 *   saturé (R / (R + G + B) ≥ 0,8), où la valeur (R − G − B) × 320 change
 *   de plus de 20 (valeurs négatives ramenées à 0) ;
 * - au plus 3 flashs dans toute fenêtre d'une seconde.
 *
 * Les luminances sont calculées pixel par pixel (sRGB linéarisé, Rec. 709),
 * puis moyennées sur la zone mesurée. Zones : l'image entière, et neuf
 * zones d'un quart de l'écran (540 × 960, au pas de 270 × 480) — un flash
 * localisé, sur une partie de l'écran, compte aussi.
 *
 * Sort en erreur si une fenêtre d'une seconde dépasse 3 flashs.
 */
import { spawn } from "node:child_process";
import ffmpegPath from "ffmpeg-static";

const W = 108; // l'image est mesurée à 108 × 192 (moyenne par zone, filtre « area »)
const H = 192;
const MAX_FLASHES = 3;

const lin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const LIN = Float64Array.from({ length: 256 }, (_, i) => lin(i / 255));

const zones = [{ name: "image entière", x: 0, y: 0, w: W, h: H }];
for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) zones.push({ name: `zone ${j * 3 + i + 1}`, x: (i * W) / 4, y: (j * H) / 4, w: W / 2, h: H / 2 });

async function readFrames(file) {
  const args = ["-v", "error", "-i", file, "-vf", `scale=${W}:${H}:flags=area`, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"];
  const p = spawn(ffmpegPath, args);
  const chunks = [];
  for await (const c of p.stdout) chunks.push(c);
  const buf = Buffer.concat(chunks);
  const size = W * H * 3;
  const frames = [];
  for (let o = 0; o + size <= buf.length; o += size) frames.push(buf.subarray(o, o + size));
  return frames;
}

/** Par zone et par image : luminance relative moyenne, et valeur « rouge saturé » moyenne. */
function measure(frame) {
  return zones.map((z) => {
    let L = 0;
    let red = 0;
    let n = 0;
    for (let y = z.y; y < z.y + z.h; y++) {
      for (let x = z.x; x < z.x + z.w; x++) {
        const o = (y * W + x) * 3;
        const r = LIN[frame[o]], g = LIN[frame[o + 1]], b = LIN[frame[o + 2]];
        L += 0.2126 * r + 0.7152 * g + 0.0722 * b;
        const sum = r + g + b;
        if (sum > 0 && r / sum >= 0.8) red += Math.max(0, r - g - b) * 320;
        n++;
      }
    }
    return { L: L / n, red: red / n };
  });
}

/**
 * Transitions par hystérésis : on suit l'extrême courant ; quand la valeur
 * repart dans l'autre sens d'au moins `delta` (et que `qualifies` accepte la
 * paire), c'est une transition — enregistrée à l'image où elle s'achève.
 */
function transitions(values, delta, qualifies) {
  const out = [];
  // Plus haut et plus bas depuis la dernière transition : une descente se
  // mesure depuis le plus haut, une montée depuis le plus bas.
  let hi = values[0];
  let lo = values[0];
  let dir = 0; // sens de la dernière transition : 1 montée, −1 descente
  for (let t = 1; t < values.length; t++) {
    const v = values[t];
    if (dir !== -1 && hi - v >= delta && qualifies(hi, v)) {
      out.push(t);
      dir = -1;
      hi = lo = v;
    } else if (dir !== 1 && v - lo >= delta && qualifies(lo, v)) {
      out.push(t);
      dir = 1;
      hi = lo = v;
    } else {
      hi = Math.max(hi, v);
      lo = Math.min(lo, v);
    }
  }
  return out;
}

/** Le plus grand nombre de flashs (paires de transitions opposées) dans une fenêtre d'une seconde. */
function maxFlashesPerSecond(times, fps) {
  let max = 0;
  let at = 0;
  for (let i = 0; i < times.length; i++) {
    let j = i;
    while (j + 1 < times.length && times[j + 1] - times[i] < fps) j++;
    const flashes = Math.floor((j - i + 1) / 2);
    if (flashes > max) {
      max = flashes;
      at = times[i] / fps;
    }
  }
  return { max, at };
}

let ok = true;
for (const file of process.argv.slice(2)) {
  const frames = await readFrames(file);
  const fps = 30;
  const m = frames.map(measure);
  let worst = { max: 0, at: 0, zone: "", kind: "" };
  for (const [zi, z] of zones.entries()) {
    const L = m.map((f) => f[zi].L);
    const red = m.map((f) => f[zi].red);
    const general = maxFlashesPerSecond(transitions(L, 0.1, (a, b) => Math.min(a, b) < 0.8), fps);
    const reds = maxFlashesPerSecond(transitions(red, 20, () => true), fps);
    for (const [kind, r] of [["général", general], ["rouge", reds]]) {
      if (r.max > worst.max) worst = { ...r, zone: z.name, kind };
    }
  }
  const pass = worst.max <= MAX_FLASHES;
  ok &&= pass;
  console.log(
    `${file} (${frames.length} images) : ${pass ? "ok " : "NON"} au plus ${worst.max} flash${worst.max > 1 ? "s" : ""} par seconde` +
      (worst.max ? ` (${worst.kind}, ${worst.zone}, fenêtre commençant à ${worst.at.toFixed(2)} s)` : "") +
      ` — limite WCAG : ${MAX_FLASHES}`,
  );
}
if (!ok) process.exit(1);
