/**
 * Fixture TEMPORAIRE pour vérifier visuellement /cont — créé puis supprimé
 * par la session de travail, jamais commité.
 * Usage : tsx scripts/tmp-ui-fixture.mts setup-full | setup-empty | clean
 */
import { readFileSync } from "node:fs";
import { parseEnv } from "node:util";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const env = parseEnv(readFileSync(".env.local", "utf8")) as Record<string, string>;
const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString: env.DATABASE_URL! }),
});

const EMAIL = "tmp-ui-check@takemehome.local";
const mode = process.argv[2];

async function clean() {
  // Cascades du schéma : Animal, AnimalPhoto, Session, Account suivent.
  await prisma.user.deleteMany({ where: { email: EMAIL } });
  console.log("fixture supprimée");
}

async function setup() {
  const user = await prisma.user.findUnique({ where: { email: EMAIL } });
  if (!user) throw new Error("inscrire d'abord le compte via l'API auth");

  if (mode === "setup-full") {
    await prisma.user.update({
      where: { id: user.id },
      data: { phone: "+40 723 111 222", publicEmail: EMAIL, county: "CJ", city: "Cluj-Napoca" },
    });
    // Reprend une photo du seed démo (URL déjà autorisée par next.config).
    const demoPhoto = await prisma.animalPhoto.findFirst({
      orderBy: { id: "asc" },
      select: { url: true },
    });
    await prisma.animal.deleteMany({ where: { userId: user.id } });
    const rex = await prisma.animal.create({
      data: {
        userId: user.id, name: "Rex", type: "DOG", sex: "MALE", ageGroup: "ADULT",
        size: "LARGE", county: "CJ", city: "Cluj-Napoca", status: "AVAILABLE",
        sterilized: true, vaccinated: true,
        description: "Un câine mare și blând.",
      },
    });
    if (demoPhoto) {
      await prisma.animalPhoto.create({
        data: { animalId: rex.id, url: demoPhoto.url, position: 0 },
      });
    }
    await prisma.animal.create({
      data: {
        userId: user.id, name: "Mița", type: "CAT", county: "CJ",
        status: "ADOPTED", sterilized: true,
      },
    });
    console.log("fixture complète : profil rempli, 2 animaux");
  } else {
    // Profil incomplet (ni téléphone ni email public) et aucun animal.
    await prisma.user.update({
      where: { id: user.id },
      data: { phone: null, publicEmail: null, county: null, city: null },
    });
    await prisma.animal.deleteMany({ where: { userId: user.id } });
    console.log("fixture vide : profil incomplet, 0 animal");
  }
}

if (mode === "clean") await clean();
else if (mode === "setup-full" || mode === "setup-empty") await setup();
else throw new Error("mode inconnu");
await prisma.$disconnect();
