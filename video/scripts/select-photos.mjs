/**
 * Choix et préparation des photos de la vidéo.
 *
 *   npm run photos
 *
 * Lit data/export.json, data/photos-metrics.json (scripts/photo-metrics.mjs)
 * et data/revue-photos.json — la revue humaine : seules les photos
 * « approved » sont utilisées ; une photo jamais revue ne l'est jamais
 * (une personne reconnaissable ne se détecte pas automatiquement). Les
 * photos à revoir sont listées, avec une planche : data/a-revoir.png.
 *
 * Distribution : data/casting.json (facultatif) fixe des photos précises
 * par rôle, et au besoin leur cadrage (focus) ; tout rôle non fixé, ou dont la photo n'est plus là, est
 * rempli automatiquement :
 *   photo1     un animal sauvé qui regarde l'objectif (à fixer à la main) ;
 *   answer     un adopté, chez lui, sur « Unele ajung acasă. » ;
 *   scroll     six adoptés, les plus récents, prénom d'un seul mot ;
 *   available  trois disponibles, prénom d'un seul mot, ville connue.
 * Une photo déposée dans public/apres/ (nom : <id de l'annonce>.jpg)
 * remplace la photo de l'adopté de « Unele ajung acasă. ».
 *
 * Écrit data/selection.json et public/graded/<photo>.jpg : chaque photo
 * recadrée (saillance) un peu plus grande que l'écran pour la dérive, et
 * étalonnée vers une série commune — luminosité, contraste, chaleur,
 * saturation rapprochés à moitié d'une cible, dans des bornes étroites.
 * Ni accentuation ni filtre. Écrit aussi public/grain/ : le grain.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import sharp from "sharp";

const read = (f) => JSON.parse(readFileSync(f, "utf8"));
const exported = read("data/export.json");
const metrics = new Map(read("data/photos-metrics.json").map((m) => [m.photoId, m]));
const review = read("data/revue-photos.json");
const casting = existsSync("data/casting.json") ? read("data/casting.json") : {};
const approved = new Set(review.approved);

/** Un prénom d'un seul mot, qui n'est pas un mot générique. */
const GENERIC = new Set(["pisică", "pisica", "pisici", "pisi", "pisicuța", "cățel", "catel", "cățelus", "catelus", "pui", "kitten", "fetița", "fetita", "nu"]);
const oneWord = (name) => /^[A-ZĂÂÎȘȚ][a-zăâîșț]{1,14}$/u.test(name.trim()) && !GENERIC.has(name.trim().toLowerCase());

/** Mêmes villes que src/places.ts : un disponible n'est retenu que si sa ville s'écrit juste. */
const placesSrc = readFileSync("src/places.ts", "utf8");
const fold = (s) => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const known = new Set([...placesSrc.matchAll(/^\s+"([^"]+)",$/gm)].map((m) => fold(m[1])));
const cityKnown = (c) => !!c && (known.has(fold(c)) || /^(bucuresti|sector \d|cluj|tg jiu|targu jiu|bucharest)/.test(fold(c)));

const usable = (photo) => approved.has(photo.id);
const firstUsable = (a) => a.photos.find(usable);
const all = [...exported.adopted.map((a) => ({ ...a, status: "adopted" })), ...exported.available.map((a) => ({ ...a, status: "available" }))];
const byPhoto = new Map(all.flatMap((a) => a.photos.map((p) => [p.id, { animal: a, photo: p }])));

const used = new Set();
function pick(fixedId, candidates) {
  const fixed = fixedId && byPhoto.get(fixedId);
  if (fixed && usable(fixed.photo) && !used.has(fixed.animal.id)) {
    used.add(fixed.animal.id);
    return fixed;
  }
  for (const c of candidates) {
    if (!used.has(c.animal.id)) {
      used.add(c.animal.id);
      return c;
    }
  }
  return null;
}
const pool = (list, filter) => list.filter(filter).map((a) => ({ animal: a, photo: firstUsable(a) })).filter((c) => c.photo);

const adoptedNamed = pool(exported.adopted, (a) => a.named && oneWord(a.name));
const availableNamed = pool(exported.available, (a) => a.named && oneWord(a.name) && cityKnown(a.city));

const photo1 = pick(casting.photo1, pool(exported.available, () => true));
const answer = pick(casting.answer, adoptedNamed);
const scroll = Array.from({ length: 6 }, (_, i) => pick(casting.scroll?.[i], adoptedNamed));
const available = Array.from({ length: 3 }, (_, i) => pick(casting.available?.[i], availableNamed));
// Rafale de la mesure 9 : des adoptés, sans texte, dans l'ordre de
// casting.json. Récapitulatif : un adopté déjà vu peut revenir, jamais la
// même photo deux fois dans la rafale.
const montagePhotos = new Set();
const montage = (casting.montage ?? [])
  .map((id) => byPhoto.get(id))
  .filter((c) => c && usable(c.photo) && c.animal.status === "adopted" && !montagePhotos.has(c.photo.id))
  .map((c) => (montagePhotos.add(c.photo.id), c));
const missing = [photo1, answer, ...scroll, ...available].some((x) => !x);

// Photo « après adoption » déposée à la main pour l'adopté de la réponse.
const apres = existsSync("public/apres") ? readdirSync("public/apres").filter((f) => /\.(jpe?g|png|webp)$/i.test(f)) : [];
const apresFile = answer && apres.find((f) => f.replace(/\.[^.]+$/, "") === answer.animal.id);

// ——— Étalonnage commun ————————————————————————————————————————————————
// 10 % au-dessus de l'écran : le zoom lent de la vidéo reste net.
const OUT_W = 1188;
const OUT_H = 2112;
const TARGET = { lum: 0.5, spread: 0.6, saturation: 0.22, warmth: 0.07 };
const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));

/** Cadrage : saillance par défaut ; data/casting.json peut fixer un côté par photo (« west », « north »…). */
const focus = (id) => casting.focus?.[id] ?? sharp.strategy.attention;
/**
 * Resserrement facultatif (casting.json, « tighten ») : la photo est agrandie
 * de `zoom` puis recadrée en gardant le haut — l'animal descend dans le
 * cadre, sous le compteur — et, selon `x` (« left », « center »,
 * « right »), le côté gauche, le centre ou le côté droit : « left » pousse
 * l'animal vers la droite. Agrandissement total toujours ≤ 1,5.
 */
const tighten = (id) => casting.tighten?.[id];

async function grade(file, id) {
  const m = metrics.get(id);
  const brightness = m ? clamp(1 + 0.5 * (TARGET.lum / m.lumMean - 1), 0.9, 1.12) : 1;
  const contrast = m ? clamp(1 + 0.5 * (TARGET.spread / Math.max(0.2, m.lumP90 - m.lumP10) - 1), 0.95, 1.08) : 1;
  const saturation = m ? clamp(1 + 0.5 * (TARGET.saturation / Math.max(0.05, m.saturation) - 1), 0.88, 1.06) : 1;
  const warm = m ? clamp(0.25 * (TARGET.warmth - m.warmth), -0.03, 0.03) : 0;
  await sharp(`public/${file}`)
    .rotate()
    .resize(Math.round(OUT_W * (tighten(id)?.zoom ?? 1)), Math.round(OUT_H * (tighten(id)?.zoom ?? 1)), { fit: "cover", position: focus(id) })
    .extract({
      left: Math.round((OUT_W * ((tighten(id)?.zoom ?? 1) - 1)) * ({ left: 0, center: 0.5, right: 1 }[tighten(id)?.x ?? "center"])),
      top: 0,
      width: OUT_W,
      height: OUT_H,
    })
    .recomb([
      [1 + warm, 0, 0],
      [0, 1, 0],
      [0, 0, 1 - warm],
    ])
    .linear(contrast, 128 * (1 - contrast))
    .modulate({ brightness, saturation })
    .jpeg({ quality: 92, mozjpeg: true })
    .toFile(`public/graded/${id}.jpg`);
  return { brightness: +brightness.toFixed(3), contrast: +contrast.toFixed(3), saturation: +saturation.toFixed(3), warmth: +warm.toFixed(3) };
}

mkdirSync("public/graded", { recursive: true });
const entry = async (c, role) => {
  if (!c) return null;
  const file = role === "answer" && apresFile ? `apres/${apresFile}` : c.photo.file;
  const id = role === "answer" && apresFile ? `apres-${c.animal.id}` : c.photo.id;
  return { role, animalId: c.animal.id, photoId: id, file: `graded/${id}.jpg`, grade: await grade(file, id) };
};
const selection = {
  createdAt: new Date().toISOString(),
  photo1: await entry(photo1, "photo1"),
  answer: await entry(answer, "answer"),
  scroll: await Promise.all(scroll.map((c) => entry(c, "scroll"))),
  available: await Promise.all(available.map((c) => entry(c, "available"))),
  montage: await Promise.all(montage.map((c) => entry(c, "montage"))),
};
writeFileSync("data/selection.json", JSON.stringify(selection, null, 2) + "\n");

// ——— Grain : six textures, changées à chaque image par la vidéo ————————————
mkdirSync("public/grain", { recursive: true });
for (let k = 0; k < 6; k++) {
  const w = 810;
  const h = 1440;
  const buf = Buffer.alloc(w * h);
  for (let i = 0; i < buf.length; i++) {
    // somme de trois uniformes : une cloche, centrée sur le gris moyen
    buf[i] = clamp(Math.round(128 + 26 * (Math.random() + Math.random() + Math.random() - 1.5)), 0, 255);
  }
  await sharp(buf, { raw: { width: w, height: h, channels: 1 } }).blur(0.4).png().toFile(`public/grain/g${k}.png`);
}

// ——— À revoir ———————————————————————————————————————————————————————————
const unreviewed = all.flatMap((a) => a.photos.filter((p) => !approved.has(p.id) && !(p.id in review.rejected)).map((p) => ({ a, p })));
if (unreviewed.length > 0) {
  const TW = 220;
  const TH = 330;
  const comps = await Promise.all(
    unreviewed.slice(0, 40).map(async ({ p }, i) => ({
      input: await sharp(`public/${p.file}`).rotate().resize(TW, TH, { fit: "cover" }).toBuffer(),
      left: (i % 8) * (TW + 6),
      top: Math.floor(i / 8) * (TH + 6),
    })),
  );
  await sharp({ create: { width: 8 * (TW + 6), height: Math.ceil(Math.min(40, unreviewed.length) / 8) * (TH + 6), channels: 3, background: "#222" } })
    .composite(comps)
    .png()
    .toFile("data/a-revoir.png");
  console.log(`${unreviewed.length} photos jamais revues (jamais utilisées) : planche data/a-revoir.png, identifiants :`);
  console.log(unreviewed.map(({ p }) => p.id).join("\n"));
}
const names = (list) => list.map((e) => (e ? all.find((a) => a.id === e.animalId)?.name : "MANQUANT")).join(", ");
console.log(`Photo 1 : ${selection.photo1?.photoId ?? "MANQUANTE"} · réponse : ${names([selection.answer])}${apresFile ? " (photo après adoption)" : ""}`);
console.log(`Adoptés : ${names(selection.scroll)} · disponibles : ${names(selection.available)} · rafale : ${names(selection.montage)}`);
if (missing) {
  console.error("Pas assez de photos revues et approuvées pour tous les rôles : revoir data/a-revoir.png.");
  process.exit(1);
}
