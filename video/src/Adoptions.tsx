import React from "react";
import { AbsoluteFill, type CalculateMetadataFunction, Sequence, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, EXPRESSIVE, PHOTO_FADE, PRODUCTIVE, SAFE } from "./brand";
import { Counter } from "./components/Counter";
import { Logo } from "./components/Logo";
import { SafeZones } from "./components/SafeZones";
import { CreamLayer, Shot, type ShotSource } from "./components/Shot";
import { Soundtrack } from "./components/Soundtrack";
import { AnimalName, Detail, Phrase, Pill, Plate } from "./components/Text";
import { CAST, COUNTER, type CastMember } from "./data";
import { vary } from "./motion";
import { buildTimeline } from "./timeline";
import { TRACKS, trackFrames, type TrackId } from "./tracks";

export type AdoptionsProps = {
  track: TrackId;
  /** A : « Unde ajung… » ; B : « Ce se întâmplă cu… ». */
  variant: "A" | "B";
  /** Maquette : des blocs gris à la place des photos. */
  mockup: boolean;
  safeZones: boolean;
};

/** La durée suit la piste : dix mesures. */
export const calculateMetadata: CalculateMetadataFunction<AdoptionsProps> = ({ props }) => ({
  durationInFrames: trackFrames(props.track, 30),
});

const QUESTION = {
  A: ["Unde ajung", "animalele salvate?"],
  B: ["Ce se întâmplă cu", "animalele salvate?"],
} as const;

const SHADES = ["#8C8782", "#6E6964", "#A19B95", "#7B7671", "#948E88", "#66615C", "#86807A", "#5F5A55", "#8F8984", "#77726D", "#9A948E"];

/**
 * Deux places pour le texte, hors des zones de sécurité :
 * - en haut à gauche, les grandes phrases posées sur une photo ;
 * - en bas à gauche, les étiquettes (nom, ville, pastille) — sous 840 px,
 *   rien dans les 300 px de droite, d'où la gauche.
 */
const PHRASE_POS: React.CSSProperties = { left: SAFE.side, top: SAFE.top + 30 };
const TAG_POS: React.CSSProperties = { left: SAFE.side, top: 990 };
const PILL_TOP = 1150;
/**
 * Un texte ne passe jamais sur une photo sans aplat : le crème plein de la
 * respiration et de la fin commence à arriver un peu avant le premier temps
 * et couvre la photo quand la phrase entre.
 */
const CREAM_LEAD = 0.35;
/** Rafale : le zoom garde la vitesse d'un plan de deux secondes, même sur un plan de 0,12 s. */
const MONTAGE_ZOOM_SPAN = 2;

export const Adoptions: React.FC<AdoptionsProps> = ({ track, variant, mockup, safeZones }) => {
  const { fps, durationInFrames } = useVideoConfig();
  const t = buildTimeline(durationInFrames / fps, fps, TRACKS[track].bpm);
  const f = (s: number) => Math.round(s * fps);

  let shade = 0;
  const source = (c: CastMember, label: string): ShotSource =>
    mockup ? { kind: "block", shade: SHADES[shade++ % SHADES.length], label } : { kind: "image", file: c.file, seed: c.seed };
  const first = source(CAST.photo1, "Photo 1 : animal sauvé, regard caméra");

  const shots: { at: number; until: number; source: ShotSource }[] = [
    { at: t.at(2), until: t.at(3), source: source(CAST.answer, `Adopté : ${CAST.answer.name}`) },
    ...t.scroll.map((s, i) => ({ at: s.start, until: s.end, source: source(CAST.scroll[i], `Adopté : ${CAST.scroll[i]?.name}`) })),
    ...t.available.map((s, i) => ({ at: s.start, until: s.end, source: source(CAST.available[i], `Disponible : ${CAST.available[i]?.name}`) })),
  ];

  // Une occurrence de mouvement par texte (motion.ts) : jamais deux pareilles.
  const mq = vary(EXPRESSIVE, "question");
  const ma = vary(EXPRESSIVE, "answer");
  const mc = vary(EXPRESSIVE, "counter");
  const mc2 = vary(EXPRESSIVE, "counter-2");
  const mb = vary(EXPRESSIVE, "breath");
  const mp = vary(EXPRESSIVE, "appeal");
  const ml = vary(EXPRESSIVE, "logo");
  const mpill = vary(PRODUCTIVE, "pill");
  const named = t.scroll.filter((s) => s.start < t.namesUntil - 1e-6);

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.cream }}>
      {/* ——— Images ——— */}
      <Sequence name="Photo 1" durationInFrames={f(t.at(2) + PHOTO_FADE)}>
        <Shot source={first} fadeIn={0} span={t.at(2) + PHOTO_FADE} />
      </Sequence>
      {shots.map((s, i) => (
        <React.Fragment key={i}>
          {/* Les crèmes s'intercalent dans l'ordre du récit : chaque couche couvre la précédente. */}
          {s.at === t.at(7) ? (
            // Respiration : le crème est plein quand la phrase entre, au moment où le beat s'efface.
            <Sequence name="Respiration, crème" from={f(t.breath.cream - CREAM_LEAD)} durationInFrames={f(t.at(7) - t.breath.cream + CREAM_LEAD + PHOTO_FADE)}>
              <CreamLayer fadeIn={CREAM_LEAD + 0.05} />
            </Sequence>
          ) : null}
          <Sequence name={`Plan ${i + 2}`} from={f(s.at)} durationInFrames={f(s.until - s.at + PHOTO_FADE)} premountFor={fps}>
            <Shot source={s.source} fadeIn={PHOTO_FADE} span={s.until - s.at + PHOTO_FADE} />
          </Sequence>
        </React.Fragment>
      ))}
      {/* ——— Mesure 9 : la rafale, coupes franches, de plus en plus rapides ——— */}
      {t.montage.map((s, i) => (
        <Sequence key={`m${i}`} name={`Rafale ${i + 1}`} from={f(s.start)} durationInFrames={Math.max(1, f(i === t.montage.length - 1 ? t.at(10) : s.end) - f(s.start))} premountFor={fps}>
          {/* Zoom à vitesse constante, quelle que soit la durée du plan : pas de pulsation. */}
          <Shot source={source(CAST.montage[i], `Rafale : ${CAST.montage[i]?.name}`)} fadeIn={0} span={MONTAGE_ZOOM_SPAN} />
        </Sequence>
      ))}
      {/* Le voile crème monte pendant la rafale et finit plein au premier temps de la mesure 10. */}
      <Sequence name="Fin, voile crème" from={f(t.veil.from)} premountFor={fps}>
        <Veil open={t.veil.closeFrom - t.veil.from} duration={t.veil.to - t.veil.from} />
      </Sequence>

      {/* ——— Mesure 1 : la question, déjà là à la première image ——— */}
      <Plate m={mq} inAt={0} present outBy={t.question.by} style={PHRASE_POS}>
        <Phrase lines={QUESTION[variant]} m={mq} inAt={0} present outBy={t.question.by} />
      </Plate>

      {/* ——— Mesure 2 : la réponse ; « acasă. » sur l'accord du 3e temps ——— */}
      <Plate m={ma} inAt={t.answer.line1} outBy={t.answer.by} style={PHRASE_POS}>
        <div style={{ display: "flex", gap: "0.27em", fontSize: 76 }}>
          <Phrase lines={["Unele ajung"]} m={ma} inAt={t.answer.line1} outBy={t.answer.by} />
          <Phrase lines={["acasă."]} m={ma} inAt={t.answer.line2} outBy={t.answer.by} />
        </div>
      </Plate>

      {/* La pastille, sur la caisse du 4e temps, reste en place jusqu'au compteur. */}
      <div style={{ position: "absolute", left: SAFE.side, top: PILL_TOP }}>
        <Pill m={mpill} inAt={t.pill.in} outBy={t.pill.by} />
      </div>

      {/* ——— Mesure 3 : les prénoms, environ une seconde chacun ——— */}
      {named.map((s, i) => {
        const m = vary(PRODUCTIVE, `name-${i}`);
        const inAt = t.names[i];
        return (
          <Plate key={i} m={m} inAt={inAt} outBy={s.end} style={TAG_POS}>
            <AnimalName text={CAST.scroll[i]?.name ?? "?"} m={m} inAt={inAt} outBy={s.end} />
          </Plate>
        );
      })}

      {/* ——— Mesures 4 et 5 : le compteur, seul grand moment ——— */}
      <Plate m={mc} inAt={t.counter.in} outBy={t.counter.by} style={{ left: SAFE.side, right: SAFE.side, top: SAFE.top + 30 }}>
        <Counter value={COUNTER} inAt={t.counter.in} countFor={t.counter.countUntil - t.counter.in} line2At={t.counter.line2} outBy={t.counter.by} m={mc} m2={mc2} />
      </Plate>

      {/* ——— Mesure 6 : respiration ——— */}
      <div style={{ position: "absolute", left: SAFE.side, right: SAFE.side, top: 600 }}>
        <Phrase lines={["Altele", "încă așteaptă."]} m={mb} inAt={t.breath.text} outBy={t.breath.by} align="center" />
      </div>

      {/* ——— Mesures 7 et 8 : les disponibles ——— */}
      {t.available.map((s, i) => {
        const animal = CAST.available[i];
        const m = vary(PRODUCTIVE, `available-${i}`);
        const inAt = s.start;
        return (
          <Plate key={i} m={m} inAt={inAt} outBy={s.end} style={TAG_POS}>
            <AnimalName text={animal?.name ?? "?"} m={m} inAt={inAt} outBy={s.end} />
            <Detail text={animal?.place ?? "?"} m={m} inAt={inAt + m.cascade} outBy={s.end} />
          </Plate>
        );
      })}

      {/* ——— Mesure 10 : « Poate » sur le premier temps, « pe tine. » sur l'accord du 3e ; mesure 11 : le logo ——— */}
      <div style={{ position: "absolute", left: SAFE.side, right: SAFE.side, top: 360, textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", gap: "0.27em", fontSize: 76 }}>
          <Phrase lines={["Poate"]} m={mp} inAt={t.appeal.line1} />
          <Phrase lines={["pe tine."]} m={mp} inAt={t.appeal.line2} />
        </div>
        {/* Une ligne de moins qu'avant : l'écart compense, le logo garde sa place. */}
        <div style={{ height: 190 }} />
        <Logo inAt={t.logo} size={92} m={ml} />
        <div style={{ height: 20 }} />
        <Detail text="takemehome.ro" color={COLORS.ink} m={ml} inAt={t.logo + ml.cascade} style={{ textAlign: "center" }} />
      </div>

      <Soundtrack track={track} />
      {safeZones ? <SafeZones /> : null}
    </AbsoluteFill>
  );
};

/**
 * Le fondu de la rafale vers l'écran de fin, en deux parties (temps locaux
 * à sa Sequence) :
 * - jusqu'au 4e temps de la mesure 9 (`open`), il monte vite puis ralentit
 *   (sinus) jusqu'à VEIL_OPEN : la rafale reste visible et chaque coupe se voit ;
 * - sur le 4e temps, il se ferme en douceur (smoothstep) pendant que la
 *   rafale continue de couper, et devient plein à `duration`.
 */
const VEIL_OPEN = 0.72;

const Veil: React.FC<{ open: number; duration: number }> = ({ open, duration }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const u = Math.min(1, Math.max(0, t / open));
  const v = Math.min(1, Math.max(0, (t - open) / (duration - open)));
  const opacity = t < open ? VEIL_OPEN * Math.sin((Math.PI / 2) * u) : VEIL_OPEN + (1 - VEIL_OPEN) * v * v * (3 - 2 * v);
  return <AbsoluteFill style={{ backgroundColor: COLORS.cream, opacity }} />;
};
