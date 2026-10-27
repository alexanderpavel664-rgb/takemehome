/**
 * Prépare la musique de la vidéo, avec ffmpeg (ffmpeg-static).
 *
 *   npm run audio
 *
 * Lit audio-sources/soul-damage.mp3 (Mixkit, voir LICENCES.md) et écrit
 * public/audio/music-soul-damage.wav, à −14 LUFS — les deux hors git. La musique seule
 * porte le montage : aucun effet sonore.
 *
 * La piste est préparée ainsi : onze mesures, au
 * début d'une phrase de la piste (grille mesurée sur les attaques). Puis :
 *   - mesure 1 : sans grave — le beat entre à la mesure 2 ;
 *   - mesure 6 : la respiration — le beat s'efface sur le premier temps,
 *     il ne reste qu'une bande médium filtrée ; il revient net sur le
 *     premier temps de la mesure 7 ;
 *   - mesure 11 : le logo apparaît, puis la musique s'éteint en fondu et atteint le silence à la
 *     fin de la mesure — cosinus surélevé à pente nulle aux deux bouts,
 *     puissance 1,5 pour une baisse régulière à l'oreille. 4 ms au début
 *     évitent un clic.
 * La vidéo s'arrête quand la musique atteint le silence (onze mesures et un temps), arrondie à l'image
 * supérieure : les quelques millisecondes de plus sont du silence.
 */
import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import ffmpegPath from "ffmpeg-static";

const FPS = 30;
const RATE = 48000;
const BARS = 11;
/**
 * Le fondu final commence quand le logo a fini d'apparaître — un temps
 * après le premier temps de la mesure 11 — et dure une mesure : la musique
 * se tait un temps après la fin de la mesure 11. Longueur totale : onze
 * mesures et un temps.
 */
const FADE_START_BEATS = 1;
const LENGTH = (b) => BARS * b + (FADE_START_BEATS * b) / 4;
const FADE_FROM = (b) => (BARS - 1) * b + (FADE_START_BEATS * b) / 4;
const OUT = "public/audio";

/**
 * Grilles mesurées : tempo par peigne de croches sur le flux spectral,
 * phase par les attaques (kick dans le sous-grave quand il est net, sinon
 * les attaques aiguës sur la grille des croches, et la croche qui porte le
 * kick). start : le premier temps du passage — un début de phrase de la
 * piste (songBar : sa mesure, pour mémoire), avec le beat présent jusqu'à
 * la mesure 11. Soul Damage, Diego Nava : retenue le 27 octobre 2026 après
 * comparaison de six pistes ; la même chaque mois.
 */
export const MUSIC = {
  "soul-damage": { file: "soul-damage.mp3", bpm: 114, start: 49.471, songBar: 24 },
};

/** La piste retenue : la même que src/tracks.ts. */
const CHOSEN = "soul-damage";

/** Plafond du limiteur, sous le −1 dBTP exigé pour garder de la marge à l'encodage AAC. */
const LIMIT_DB = -1.6;
/** Quelques millisecondes avant l'attaque : le transitoire reste entier. */
const PREROLL = 0.003;

const ff = (args) => execFileSync(ffmpegPath, ["-hide_banner", "-nostats", "-y", ...args], { stdio: ["ignore", "pipe", "pipe"] });

/** Sonie intégrée et crête vraie d'un fichier. */
function measure(file) {
  const r = spawnSync(ffmpegPath, ["-hide_banner", "-nostats", "-i", file, "-af", "loudnorm=print_format=json", "-f", "null", "-"], {
    encoding: "utf8",
  });
  const json = JSON.parse(r.stderr.slice(r.stderr.lastIndexOf("{")));
  return { i: Number(json.input_i), tp: Number(json.input_tp) };
}

const n = (x) => x.toFixed(6);

/** Gain du fondu final : 1 avant `from`, ((1 + cos πu) / 2)^1,5 sur `dur`, 0 après. */
const fadeOut = (from, dur) =>
  `if(lt(t,${n(from)}),1,if(gt(t,${n(from + dur)}),0,pow((1+cos(PI*(t-${n(from)})/${n(dur)}))/2,1.5)))`;

function prepare(id, t, targetLufs) {
  const b = 240 / t.bpm;
  const q = b / 4;
  const start = t.start - PREROLL;
  const frames = Math.ceil(LENGTH(b) * FPS - 1e-6);
  const D = frames / FPS;
  const sw = 0.008; // bascule juste avant le premier temps : l'attaque du kick reste entière

  // Gains, en fonction du temps de sortie t (s).
  const full = [
    `if(lt(t,${n(b - sw)}),0,`,
    `if(lt(t,${n(b)}),(t-${n(b - sw)})/${n(sw)},`,
    `if(lt(t,${n(5 * b)}),1,`,
    `if(lt(t,${n(5 * b + q)}),1-(t-${n(5 * b)})/${n(q)},`,
    `if(lt(t,${n(6 * b - sw)}),0,`,
    `if(lt(t,${n(6 * b)}),(t-${n(6 * b - sw)})/${n(sw)},1))))))`,
  ].join("");
  const noLow = `if(lt(t,${n(b)}),1-(${full}),0)`;
  const breath = `if(between(t,${n(5 * b)},${n(6 * b)}),1-(${full}),0)`;

  const graph = [
    `[0:a]atrim=start=${n(start)}:duration=${n(LENGTH(b) + 0.05)},asetpts=PTS-STARTPTS,aresample=${RATE},asetnsamples=n=48,asplit=3[a][b][c];`,
    `[a]volume=eval=frame:volume='${full}'[full];`,
    `[b]highpass=f=220,highpass=f=220,volume=eval=frame:volume='${noLow}'[nolow];`,
    `[c]highpass=f=380,highpass=f=380,lowpass=f=2400,lowpass=f=2400,volume=eval=frame:volume='${breath}'[breath];`,
    `[full][nolow][breath]amix=inputs=3:normalize=0,atrim=duration=${n(LENGTH(b))},afade=t=in:d=0.004[out]`,
  ].join("");
  const tmp = `${OUT}/.tmp-${id}.wav`;
  const lvl = `${OUT}/.lvl-${id}.wav`;
  const out = `${OUT}/music-${id}.wav`;
  ff(["-i", `audio-sources/${t.file}`, "-filter_complex", graph, "-map", "[out]", "-ac", "2", "-c:a", "pcm_s16le", tmp]);

  // Niveau visé, mesuré sur le fichier fini (fondu compris), crête vraie
  // sous −1 dBTP : un limiteur doux (attaque 2 ms, relâchement 80 ms),
  // suréchantillonné ×4, ne touche que les attaques quand le gain le
  // demande. Le fondu vient après : rien ne le contrarie.
  let gain = targetLufs - measure(tmp).i;
  let m;
  for (let pass = 0; pass < 3; pass++) {
    const chain = [
      `volume=${gain.toFixed(2)}dB`,
      `aresample=${4 * RATE}`,
      `alimiter=limit=${(10 ** (LIMIT_DB / 20)).toFixed(4)}:attack=2:release=80:level=disabled`,
      `aresample=${RATE}`,
    ].join(",");
    ff(["-i", tmp, "-af", chain, "-c:a", "pcm_s16le", lvl]);
    ff(["-i", lvl, "-af", `asetnsamples=n=48,volume=eval=frame:volume='${fadeOut(FADE_FROM(b), b)}',apad=whole_dur=${n(D)}`, "-c:a", "pcm_s16le", out]);
    m = measure(out);
    if (Math.abs(m.i - targetLufs) < 0.15) break;
    gain += targetLufs - m.i;
  }
  for (const f of [tmp, lvl]) execFileSync("rm", [f]);
  return { id, bpm: t.bpm, frames, seconds: D, bar: b, start, ...m };
}

const ids = [CHOSEN];
const target = -14;
mkdirSync(OUT, { recursive: true });
const report = [];
for (const id of ids) {
  const m = prepare(id, MUSIC[id], target);
  report.push(m);
  console.log(
    `${id} : ${BARS} mesures, ${m.frames} images (${m.seconds.toFixed(3)} s, mesure ${m.bar.toFixed(4)} s), ` +
      `${m.i.toFixed(1)} LUFS, crête ${m.tp.toFixed(1)} dBTP`,
  );
}
writeFileSync(`${OUT}/audio.json`, JSON.stringify(report, null, 2) + "\n");
