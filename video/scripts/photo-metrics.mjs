/**
 * Mesures des photos exportées, pour le tri (scripts/select-photos.mjs).
 *
 *   node scripts/photo-metrics.mjs   → data/photos-metrics.json
 *
 * Pour chaque photo de data/export.json : dimensions réelles, agrandissement
 * nécessaire pour remplir 1080 × 1920, luminance (moyenne, 10e et 90e
 * centiles), netteté (variance du laplacien, à taille normalisée),
 * saturation et chaleur moyennes — ces trois dernières servent aussi à
 * l'étalonnage commun.
 */
import { readFileSync, writeFileSync } from "node:fs";
import sharp from "sharp";

const exported = JSON.parse(readFileSync("data/export.json", "utf8"));
const W = 1080;
const H = 1920;

/** Luminance et netteté sur une version grise de 1000 px de grand côté. */
async function measure(file) {
  const img = sharp(`public/${file}`).rotate();
  const meta = await img.metadata();
  const oriented = (meta.orientation ?? 1) >= 5;
  const width = oriented ? meta.height : meta.width;
  const height = oriented ? meta.width : meta.height;

  const { data: g, info } = await sharp(`public/${file}`)
    .rotate()
    .resize({ width: 1000, height: 1000, fit: "inside" })
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const w = info.width;
  const h = info.height;
  const hist = new Array(256).fill(0);
  let sum = 0;
  for (const v of g) {
    hist[v]++;
    sum += v;
  }
  const pct = (p) => {
    let acc = 0;
    for (let i = 0; i < 256; i++) {
      acc += hist[i];
      if (acc >= p * g.length) return i / 255;
    }
    return 1;
  };
  // Laplacien 4-voisins.
  let lsum = 0;
  let lsq = 0;
  let n = 0;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      const l = 4 * g[i] - g[i - 1] - g[i + 1] - g[i - w] - g[i + w];
      lsum += l;
      lsq += l * l;
      n++;
    }
  }
  const lapVar = lsq / n - (lsum / n) ** 2;

  const { data: c } = await sharp(`public/${file}`).rotate().resize(200, 200, { fit: "inside" }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  let r = 0;
  let gr = 0;
  let b = 0;
  let sat = 0;
  for (let i = 0; i < c.length; i += 3) {
    const R = c[i] / 255;
    const G = c[i + 1] / 255;
    const B = c[i + 2] / 255;
    r += R;
    gr += G;
    b += B;
    const mx = Math.max(R, G, B);
    const mn = Math.min(R, G, B);
    sat += mx === 0 ? 0 : (mx - mn) / mx;
  }
  const px = c.length / 3;
  return {
    width,
    height,
    coverScale: Math.max(W / width, H / height),
    lumMean: sum / g.length / 255,
    lumP10: pct(0.1),
    lumP90: pct(0.9),
    sharpness: Math.round(lapVar),
    saturation: sat / px,
    warmth: (r - b) / px,
    rgb: [r / px, gr / px, b / px],
  };
}

const out = [];
for (const [status, list] of [
  ["adopted", exported.adopted],
  ["available", exported.available],
]) {
  for (const a of list) {
    for (const p of a.photos) {
      out.push({ animalId: a.id, name: a.name, status, position: p.position, photoId: p.id, file: p.file, ...(await measure(p.file)) });
    }
  }
}
writeFileSync("data/photos-metrics.json", JSON.stringify(out, null, 2) + "\n");
console.log(`${out.length} photos mesurées → data/photos-metrics.json`);
