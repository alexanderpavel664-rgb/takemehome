/**
 * Surveillance du store Vercel Blob — lecture seule, rien n'est supprimé.
 *
 *   npm run stockage:blob              occupation, alerte, orphelins
 *   npm run stockage:blob -- --detail  liste aussi les orphelins
 *
 * Le quota du plan Hobby est de 1 Go (lu ici comme 10⁹ octets, la lecture
 * prudente) et dépasser N'IMPORTE QUELLE limite Blob met le store en pause
 * 30 jours : plus d'envoi de photo, et les aperçus Open Graph (URL Blob
 * directes) cassés. D'où l'alerte à 600 Mo, bien avant le mur.
 *
 * Orphelin = fichier du store qu'aucune ligne AnimalPhoto ne référence, ni en
 * production ni en dev : la dev et la prod partagent ce store, une photo de
 * test n'est donc pas un orphelin. Causes connues : formulaire abandonné
 * après l'envoi des photos, échec d'une suppression best-effort
 * (lib/blob.ts). Les deux bases sont lues en transaction READ ONLY vérifiée.
 *
 * Coût : une opération avancée Vercel Blob (list) par tranche de 1 000
 * fichiers, sur 2 000 par mois en Hobby. À lancer chaque semaine, pas en
 * boucle. Code de sortie 2 au-delà du seuil d'alerte.
 */

import { readFileSync } from "node:fs";
import { parseEnv } from "node:util";
import { list } from "@vercel/blob";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient, type Prisma } from "../src/generated/prisma/client";

const QUOTA_BYTES = 1e9;
const ALERT_BYTES = 600e6;
// Un fichier plus jeune peut appartenir à un formulaire en cours d'envoi.
const ORPHAN_MIN_AGE_MS = 48 * 3600 * 1000;

const detail = process.argv.includes("--detail");
const env = parseEnv(readFileSync(".env.local", "utf8")) as Record<string, string | undefined>;
const token = env.BLOB_READ_WRITE_TOKEN?.trim();
if (!token) {
  console.error("BLOB_READ_WRITE_TOKEN absente de .env.local.");
  process.exit(1);
}

const mo = (bytes: number) => `${(bytes / 1e6).toFixed(1).replace(".", ",")} Mo`;

async function referencedUrls(label: string, url: string | undefined): Promise<Set<string> | null> {
  if (!url?.trim()) {
    console.log(`  ${label} : variable absente, base non lue.`);
    return null;
  }
  const prisma = new PrismaClient({ adapter: new PrismaNeon({ connectionString: url.trim() }) });
  try {
    const rows = await prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        await tx.$executeRaw`SET TRANSACTION READ ONLY`;
        const [row] = await tx.$queryRaw<{ transaction_read_only: string }[]>`SHOW transaction_read_only`;
        if (row?.transaction_read_only !== "on") {
          throw new Error(`${label} : lecture seule non confirmée, arrêt.`);
        }
        return tx.$queryRaw<{ url: string }[]>`SELECT url FROM "AnimalPhoto"`;
      },
      { maxWait: 30_000, timeout: 60_000 },
    );
    return new Set(rows.map((r) => r.url));
  } finally {
    await prisma.$disconnect();
  }
}

// ——— Le store ——————————————————————————————————————————————————————————
const blobs: { url: string; pathname: string; size: number; uploadedAt: Date }[] = [];
let cursor: string | undefined;
let calls = 0;
do {
  const page = await list({ token, limit: 1000, cursor });
  calls++;
  blobs.push(...page.blobs);
  cursor = page.hasMore ? page.cursor : undefined;
} while (cursor);

const total = blobs.reduce((sum, b) => sum + b.size, 0);
const alert = total >= ALERT_BYTES;
console.log("═".repeat(72));
console.log(`STORE VERCEL BLOB — ${blobs.length} fichier(s), ${mo(total)} sur 1 Go (${((total / QUOTA_BYTES) * 100).toFixed(1).replace(".", ",")} %)`);
console.log("═".repeat(72));
if (alert) {
  console.log(`⚠️  ALERTE : plus de ${mo(ALERT_BYTES)} occupés. Au-delà de 1 Go, le store est en pause 30 jours (plan Hobby).`);
} else {
  console.log(`Sous le seuil d'alerte (${mo(ALERT_BYTES)}) : reste ${mo(ALERT_BYTES - total)} avant l'alerte.`);
}
const average = blobs.length ? total / blobs.length : 0;
console.log(`Photo moyenne : ${Math.round(average / 1000)} ko. (${calls} appel(s) list.)`);

// ——— Orphelins ——————————————————————————————————————————————————————————
console.log("\nRéférences en base :");
const [prod, dev] = await Promise.all([
  referencedUrls("production", env.PRODUCTION_DATABASE_URL),
  referencedUrls("dev", env.DATABASE_URL),
]);
if (!prod || !dev) {
  console.log("Orphelins non calculés : il faut les deux bases (le store est partagé).");
} else {
  console.log(`  production : ${prod.size} photo(s) · dev : ${dev.size} photo(s)`);
  const now = Date.now();
  const orphans = blobs.filter((b) => !prod.has(b.url) && !dev.has(b.url));
  const old = orphans.filter((b) => now - b.uploadedAt.getTime() > ORPHAN_MIN_AGE_MS);
  const devOnly = blobs.filter((b) => dev.has(b.url) && !prod.has(b.url));
  console.log(
    `Orphelins : ${orphans.length} (${mo(orphans.reduce((s, b) => s + b.size, 0))}), dont ${old.length} de plus de 48 h.`,
  );
  console.log(`Photos de la dev seule : ${devOnly.length} (${mo(devOnly.reduce((s, b) => s + b.size, 0))}).`);
  if (detail) {
    for (const b of orphans) {
      console.log(`  ${b.uploadedAt.toISOString().slice(0, 16)}  ${Math.round(b.size / 1000)} ko  ${b.pathname}`);
    }
  }
}

process.exitCode = alert ? 2 : 0;
