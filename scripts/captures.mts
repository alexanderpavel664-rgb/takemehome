/**
 * Captures d'écran de la V3 pour les réseaux sociaux, sur le serveur de dev
 * local et les données de `npm run seed:captures`.
 *
 *   npm run dev          (dans un autre terminal)
 *   npm run captures     PNG dans social-export/captures/ (hors git)
 *
 * Serveur : http://localhost:3000, ou CAPTURES_URL=http://localhost:3100.
 * WebKit (le moteur de Safari), 393 × 852 à 3× : un iPhone 15 Pro, des PNG
 * de 1179 px de large.
 *
 * Ne lit pas la base et n'écrit nulle part : les fiches sont retrouvées par
 * leur nom sur la page des chiens de Cluj, et les favoris ne vivent que
 * dans le localStorage du navigateur jetable de Playwright.
 */

import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { devices, webkit, type Locator, type Page } from "playwright";
import { judetPath } from "../src/lib/judete";
import { STR } from "../src/lib/strings";

const BASE = (process.env.CAPTURES_URL ?? "http://localhost:3000").replace(/\/$/, "");
const OUT = "social-export/captures";
const WIDTH = 393;
const HEIGHT = 852;

// Les chiens de scripts/seed-captures.mts.
const CAROUSEL_DOG = "Maya";
const HEALTH_DOG = "Lola";
// Dans l'ordre des touchers : /favorite montre le dernier ajouté en
// premier, donc la portée, puis la paire, puis Maya.
const FAVORITE_DOGS = ["Maya", "Rex și Bella", "Tina, Bubu și Fram"];

try {
  await fetch(BASE, { signal: AbortSignal.timeout(10_000) });
} catch {
  console.error(`Aucun serveur sur ${BASE} : lancer d'abord npm run dev.`);
  process.exit(1);
}

/** Polices prêtes, et chaque photo visible chargée puis décodée. */
async function settle(page: Page): Promise<void> {
  await page.waitForLoadState("load");
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  await page.waitForFunction(
    () =>
      Array.from(document.images)
        .filter((img) => {
          const r = img.getBoundingClientRect();
          return r.width > 0 && r.bottom > 0 && r.top < window.innerHeight;
        })
        .every((img) => img.complete && img.naturalWidth > 0),
    undefined,
    { timeout: 120_000 },
  );
  await page.evaluate(() =>
    Promise.all(Array.from(document.images).map((img) => img.decode().catch(() => {}))).then(
      () => undefined,
    ),
  );
}

/** Haut et bas d'un élément dans le document (indépendants du défilement). */
async function docBox(locator: Locator): Promise<{ top: number; bottom: number }> {
  return locator.evaluate((el) => {
    const r = el.getBoundingClientRect();
    return { top: r.top + window.scrollY, bottom: r.bottom + window.scrollY };
  });
}

/**
 * Ce qu'un bord d'écran ne doit pas couper, en intervalles verticaux du
 * document : chaque ligne de texte, chaque image, icône ou boîte visible
 * (bordure ou fond). Les grands blocs (plus d'un demi-écran) n'en font pas
 * partie : les traverser est normal. Les éléments fixes (barre de contact)
 * non plus : ils ne défilent pas. Aussi : ce qui couvre le bas de l'écran.
 */
async function inkLayout(page: Page) {
  return page.evaluate((maxBlock) => {
    const sy = window.scrollY;
    const all = Array.from(document.body.querySelectorAll("*"));
    const fixed = all.filter((el) => getComputedStyle(el).position === "fixed");
    const intervals: [number, number][] = [];
    for (const el of all) {
      if (fixed.some((f) => f.contains(el))) continue;
      const style = getComputedStyle(el);
      if (style.visibility === "hidden") continue;
      const boxed =
        el instanceof HTMLImageElement ||
        el instanceof SVGSVGElement ||
        parseFloat(style.borderTopWidth) > 0 ||
        parseFloat(style.borderBottomWidth) > 0 ||
        style.backgroundColor !== "rgba(0, 0, 0, 0)";
      const r = el.getBoundingClientRect();
      if (boxed && r.width > 1 && r.height > 1 && r.height < maxBlock) {
        intervals.push([r.top + sy, r.bottom + sy]);
      }
    }
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const range = document.createRange();
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      if (!node.textContent?.trim() || fixed.some((f) => f.contains(node))) continue;
      range.selectNodeContents(node);
      for (const r of Array.from(range.getClientRects())) {
        if (r.width > 1 && r.height > 1) intervals.push([r.top + sy, r.bottom + sy]);
      }
    }
    // Une barre fixée en bas cache le bord bas : le contenu y passe dessous.
    const bottomCovered = fixed.some((f) => {
      const r = f.getBoundingClientRect();
      return r.bottom >= window.innerHeight - 1 && r.top > window.innerHeight / 2;
    });
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    return { intervals, bottomCovered, maxScroll };
  }, HEIGHT / 2);
}

// Écart minimal entre un bord d'écran et ce qu'il ne doit pas couper.
const CLEARANCE = 2;

/**
 * L'écran entier, défilé pour que la zone [top, bottom] (coordonnées du
 * document) ait son milieu au milieu de l'écran — au pixel près le plus
 * proche où les bords ne coupent ni une lettre ni une boîte. Le défilement
 * s'arrête aux bords de la page : une zone trop près du haut y reste, et
 * l'écart restant est signalé.
 */
async function shootCentered(
  page: Page,
  { top, bottom }: { top: number; bottom: number },
  file: string,
): Promise<string> {
  const middle = (top + bottom) / 2;
  const { intervals, bottomCovered, maxScroll } = await inkLayout(page);
  const clearAt = (y: number) =>
    intervals.every(([a, b]) => y < a - CLEARANCE || y > b + CLEARANCE);
  const clean = (y: number) =>
    (y === 0 || clearAt(y)) && (bottomCovered || y === maxScroll || clearAt(y + HEIGHT));
  const ideal = Math.min(Math.max(Math.round(middle - HEIGHT / 2), 0), maxScroll);
  let target = ideal;
  for (let d = 0; d <= HEIGHT / 2; d++) {
    const found = [ideal + d, ideal - d].find((y) => y >= 0 && y <= maxScroll && clean(y));
    if (found !== undefined) {
      target = found;
      break;
    }
  }
  const scrollY = await page.evaluate((y) => {
    window.scrollTo({ top: y, behavior: "instant" });
    return window.scrollY;
  }, target);
  await settle(page);
  const path = `${OUT}/${file}`;
  await page.screenshot({ path });
  const offset = Math.round(middle - scrollY - HEIGHT / 2);
  if (Math.abs(offset) > 1) {
    const why =
      ideal !== Math.round(middle - HEIGHT / 2)
        ? `${offset < 0 ? "haut" : "bas"} de la page atteint, impossible de défiler plus`
        : "pour que le bord de l'écran ne coupe aucune ligne";
    notes.push(
      `${file} : milieu de l'élément à ${Math.abs(offset)} px ${offset < 0 ? "au-dessus" : "au-dessous"} du centre (${why}).`,
    );
  }
  return path;
}

/** Le lien de la carte d'un chien de la grille (son nom y figure). */
async function animalHref(page: Page, name: string): Promise<string> {
  const href = await page
    .locator('a[href^="/animal/"]')
    .filter({ hasText: name })
    .first()
    .getAttribute("href", { timeout: 10_000 });
  if (!href) throw new Error(`${name} absent de la page : lancer npm run seed:captures.`);
  return href;
}

mkdirSync(OUT, { recursive: true });
const browser = await webkit.launch();
const shots: string[] = [];
const notes: string[] = [];
try {
  const context = await browser.newContext({
    ...devices["iPhone 15 Pro"],
    viewport: { width: WIDTH, height: HEIGHT },
    deviceScaleFactor: 3,
    locale: "ro-RO",
    timezoneId: "Europe/Bucharest",
    colorScheme: "light",
    // Aucune transition à mi-course sur une capture.
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  // Le premier passage sur une route la compile (next dev) : patience.
  page.setDefaultNavigationTimeout(180_000);

  // 1. La page des chiens de Cluj : titre et haut de la grille.
  await page.goto(`${BASE}${judetPath("DOG", "CJ")}`);
  await settle(page);
  const path1 = `${OUT}/caini-cluj.png`;
  await page.screenshot({ path: path1 });
  shots.push(path1);
  const carouselHref = await animalHref(page, CAROUSEL_DOG);
  const healthHref = await animalHref(page, HEALTH_DOG);

  // 2. La portée, la paire et Maya ajoutées aux favoris d'un toucher sur le
  //    cœur, puis /favorite.
  for (const name of FAVORITE_DOGS) {
    const label = STR.favorite.toggleNamed(name);
    await page.getByRole("button", { name: label, exact: true }).tap();
    await page.locator(`button[aria-label="${label}"][aria-pressed="true"]`).waitFor();
  }
  await page.goto(`${BASE}/favorite`);
  for (const name of FAVORITE_DOGS) {
    await page.locator('a[href^="/animal/"]').filter({ hasText: name }).first().waitFor();
  }
  await settle(page);
  const path2 = `${OUT}/favorite.png`;
  await page.screenshot({ path: path2 });
  shots.push(path2);

  // 3. La fiche à 4 photos, écran entier, centré sur le bloc photo +
  //    indicateur du carrousel + nom.
  await page.goto(`${BASE}${carouselHref}`);
  const carousel = page.getByRole("region", { name: STR.animal.photosLabel(CAROUSEL_DOG) });
  const title = page.getByRole("heading", { level: 1 });
  await carousel.waitFor();
  await settle(page);
  shots.push(
    await shootCentered(
      page,
      { top: (await docBox(carousel)).top, bottom: (await docBox(title)).bottom },
      "fisa-carusel.png",
    ),
  );

  // 4. La fiche déparasitée, écran entier, centré sur la section Sănătate.
  await page.goto(`${BASE}${healthHref}`);
  const health = page.locator("section").filter({
    has: page.getByRole("heading", { level: 2, name: STR.animal.health, exact: true }),
  });
  await health.waitFor();
  await settle(page);
  shots.push(await shootCentered(page, await docBox(health), "fisa-sanatate.png"));
} finally {
  await browser.close();
}

console.log("Captures :");
for (const shot of shots) {
  console.log(`  ${resolve(shot)}`);
}
for (const note of notes) {
  console.log(`Note — ${note}`);
}
