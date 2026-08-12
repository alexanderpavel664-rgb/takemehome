/**
 * Données de démonstration — 12 animaux réalistes pour valider le design.
 *
 *   npm run seed:demo         insère (ré-exécutable : remplace les données démo)
 *   npm run seed:demo:clean   supprime TOUTES les données démo, rien d'autre
 *
 * SÛRETÉ — la base visée est la branche de PRODUCTION :
 * - Tout est rattaché à un compte dédié (DEMO_EMAIL). L'annulation supprime
 *   ce compte ; les cascades du schéma (Animal.userId → User,
 *   AnimalPhoto.animalId → Animal) emportent animaux et photos. Aucune
 *   requête ne touche un autre utilisateur.
 * - Le compte démo n'a ni mot de passe ni compte OAuth (aucune ligne
 *   Account) : personne ne peut s'y connecter.
 * - Les photos sont des URLs Unsplash (libres de droits, vérifiées une à
 *   une : bons animaux, aucun visage humain) stockées telles quelles dans
 *   AnimalPhoto.url — rien ne part dans le store Vercel Blob.
 *   L'hôte images.unsplash.com est autorisé dans next.config.ts.
 */

import { readFileSync } from "node:fs";
import { parseEnv } from "node:util";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import type { Prisma } from "../src/generated/prisma/client";

const DEMO_EMAIL = "demo@takemehome.local";

// .env.local fait foi, et lui seul. Pas de process.loadEnvFile : il
// n'écrase pas une variable déjà exportée par le shell — un DATABASE_URL
// resté dans l'environnement viserait silencieusement une autre base que
// celle du fichier. Sur un script qui écrit en production, l'ambiguïté
// est interdite.
let DATABASE_URL: string | undefined;
try {
  DATABASE_URL = (
    parseEnv(readFileSync(".env.local", "utf8")) as Record<string, string | undefined>
  ).DATABASE_URL;
} catch {
  console.error("Impossible de lire .env.local — lancer depuis la racine du repo.");
  process.exit(1);
}
if (!DATABASE_URL) {
  console.error("DATABASE_URL absente de .env.local.");
  process.exit(1);
}

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString: DATABASE_URL }),
});

/**
 * Le profil du compte démo est complet : sans téléphone/email public, la
 * barre de contact des fiches n'apparaîtrait pas.
 *
 * Le numéro : la Roumanie n'a pas de tranche fictive réservée (vérifié dans
 * le plan national ANCOM) — 0790 est le bloc mobile le moins alloué et le
 * suffixe 000 000 est un « golden number » que les opérateurs retiennent.
 * Pour tester réellement le bouton d'appel, remplacez-le par VOTRE numéro
 * et relancez `npm run seed:demo`.
 */
const DEMO_USER = {
  name: "Ana Popescu",
  phone: "0790 000 000",
  publicEmail: DEMO_EMAIL,
  county: "CJ",
  city: "Cluj-Napoca",
  description:
    "Salvez și îngrijesc animale din zona Clujului până își găsesc o familie potrivită.",
};

const DAY = 24 * 60 * 60 * 1000;

type DemoAnimal = Omit<
  Prisma.AnimalUncheckedCreateInput,
  "userId" | "photos" | "createdAt" | "updatedAt"
> & {
  /** URL Unsplash vérifiée ; absente = teste l'aplat crème de repli. */
  photoUrl?: string;
  /** Ancienneté de la dernière mise à jour, en jours — étage la grille et les libellés « Mis à jour… ». */
  updatedDaysAgo: number;
};

// 7 chiens, 4 chats, 1 autre · 6 județe · 4 tranches d'âge · 3 tailles ·
// 2 adoptés · 2 sans photo · descriptions roumaines (diacritiques à virgule
// souscrite), de la très courte (Mimi) à la très longue (Bruno).
const ANIMALS: DemoAnimal[] = [
  {
    name: "Luna",
    type: "DOG",
    sex: "FEMALE",
    ageGroup: "YOUNG",
    ageText: "1 an",
    size: "MEDIUM",
    county: "CJ",
    city: "Cluj-Napoca",
    sterilized: true,
    vaccinated: true,
    microchipped: true,
    goodWithKids: true,
    goodWithDogs: true,
    description:
      "Luna a fost găsită pe marginea drumului lângă Florești. E o cățelușă blândă și veselă, care se înțelege de minune cu copiii și cu alți câini. Caută o familie răbdătoare, la casă sau la apartament.",
    photoUrl:
      "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=1200&q=80",
    updatedDaysAgo: 0.1,
  },
  {
    name: "Bobiță",
    type: "DOG",
    sex: "MALE",
    ageGroup: "BABY",
    ageText: "4 luni",
    size: "SMALL",
    county: "BH",
    city: "Oradea",
    vaccinated: true,
    goodWithKids: true,
    goodWithDogs: true,
    goodWithCats: true,
    description:
      "Bobiță a fost găsit într-o cutie, împreună cu frații lui. E vaccinat la zi, jucăuș și foarte sociabil — se împacă și cu copiii, și cu câinii, și cu pisicile.",
    photoUrl:
      "https://images.unsplash.com/photo-1507146426996-ef05306b995a?w=1200&q=80",
    updatedDaysAgo: 0.6,
  },
  {
    // Sans photo : l'aplat crème + nom en Display doit apparaître dès la
    // première rangée de la grille.
    name: "Mimi",
    type: "CAT",
    sex: "FEMALE",
    ageGroup: "BABY",
    ageText: "3 luni",
    size: "SMALL",
    county: "CJ",
    city: "Cluj-Napoca",
    goodWithKids: true,
    goodWithCats: true,
    description: "Blândă și jucăușă.",
    updatedDaysAgo: 1,
  },
  {
    name: "Ștefan",
    type: "CAT",
    sex: "MALE",
    ageGroup: "ADULT",
    size: "MEDIUM",
    county: "IS",
    city: "Iași",
    sterilized: true,
    vaccinated: true,
    goodWithCats: true,
    description:
      "Ștefan e un motan uriaș și pufos, cu blană roșcată. Preferă oamenii calmi și somnul la soare. Se înțelege bine cu alte pisici.",
    photoUrl:
      "https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=1200&q=80",
    updatedDaysAgo: 2,
  },
  {
    name: "Azorel",
    type: "DOG",
    sex: "MALE",
    ageGroup: "YOUNG",
    ageText: "2 ani",
    size: "MEDIUM",
    county: "IS",
    city: "Pașcani",
    vaccinated: true,
    microchipped: true,
    goodWithKids: true,
    description:
      "Azorel e un cățel isteț și plin de energie. Învață repede comenzi noi și adoră copiii. Ar fi fericit într-o casă cu curte, lângă Pașcani sau oriunde în țară.",
    photoUrl:
      "https://images.unsplash.com/photo-1601979031925-424e53b6caaa?w=1200&q=80",
    updatedDaysAgo: 3,
  },
  {
    name: "Ghiță",
    type: "OTHER",
    sex: "MALE",
    ageGroup: "YOUNG",
    ageText: "8 luni",
    size: "SMALL",
    county: "BV",
    city: "Râșnov",
    sterilized: true,
    description:
      "Ghiță e un iepuraș curios și curat: mănâncă din palmă și e obișnuit cu litiera. Are nevoie de un țarc spațios, nu de o cușcă mică.",
    photoUrl:
      "https://images.unsplash.com/photo-1452857297128-d9c29adba80b?w=1200&q=80",
    updatedDaysAgo: 4,
  },
  {
    // city volontairement absent : la fiche doit retomber sur le județ seul.
    name: "Rex",
    type: "DOG",
    sex: "MALE",
    ageGroup: "ADULT",
    ageText: "3 ani",
    size: "LARGE",
    county: "TM",
    vaccinated: true,
    goodWithDogs: true,
    description:
      "Rex e un câine energic, obișnuit cu viața afară. Are nevoie de mișcare zilnică și de un gard înalt. Nu îl recomandăm la apartament.",
    photoUrl:
      "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=1200&q=80",
    updatedDaysAgo: 6,
  },
  {
    // Sans photo : deuxième test de l'aplat, plus bas dans la grille.
    name: "Codruța",
    type: "DOG",
    sex: "FEMALE",
    ageGroup: "ADULT",
    size: "MEDIUM",
    county: "BV",
    city: "Brașov",
    sterilized: true,
    vaccinated: true,
    goodWithDogs: true,
    description:
      "Codruța vine dintr-un adăpost supraaglomerat din Brașov. E puțin timidă la început, dar extrem de loială odată ce prinde încredere. O poză vine în curând — promitem că e frumoasă.",
    updatedDaysAgo: 8,
  },
  {
    name: "Mițu",
    type: "CAT",
    sex: "MALE",
    ageGroup: "SENIOR",
    ageText: "10 ani",
    size: "MEDIUM",
    county: "B",
    city: "București",
    sterilized: true,
    vaccinated: true,
    microchipped: true,
    goodWithKids: true,
    goodWithCats: true,
    description:
      "Mițu are zece ani, iar stăpâna lui s-a mutat în străinătate. E un motan liniștit, care vrea doar un pervaz însorit și puțină companie.",
    photoUrl:
      "https://images.unsplash.com/photo-1495360010541-f48722b34f7d?w=1200&q=80",
    updatedDaysAgo: 12,
  },
  {
    // La très longue description : plusieurs paragraphes (whitespace-pre-line
    // sur la fiche) — le vrai ton d'une annonce de sauvetage.
    name: "Bruno",
    type: "DOG",
    sex: "MALE",
    ageGroup: "SENIOR",
    ageText: "9 ani",
    size: "LARGE",
    county: "B",
    city: "București",
    sterilized: true,
    vaccinated: true,
    microchipped: true,
    goodWithKids: true,
    goodWithDogs: true,
    goodWithCats: true,
    description:
      "Bruno are în jur de nouă ani și a trăit toată viața legat în lanț, într-o curte de la marginea Bucureștiului. Când proprietarul s-a mutat, a rămas singur în urmă, cu o cușcă spartă și un lighean ruginit.\n\n" +
      "În ciuda a tot ce a trăit, Bruno e cel mai blând câine pe care l-am salvat vreodată. Nu latră, nu trage în lesă, se topește după mângâieri. Se înțelege cu copiii, cu ceilalți câini și — spre surprinderea noastră — chiar și cu pisicile din curte.\n\n" +
      "Căutăm pentru el o familie liniștită, care să-i ofere ce n-a avut niciodată: un loc înăuntru, lângă oameni. Un câine senior se adaptează mai repede decât s-ar crede — și puțini știu să fie recunoscători ca el. O canapea caldă la bătrânețe nu e mult, dar pentru Bruno ar însemna totul.",
    photoUrl:
      "https://images.unsplash.com/photo-1552053831-71594a27632d?w=1200&q=80",
    updatedDaysAgo: 15,
  },
  {
    name: "Bella",
    type: "DOG",
    sex: "FEMALE",
    ageGroup: "ADULT",
    ageText: "5 ani",
    size: "SMALL",
    county: "TM",
    city: "Lugoj",
    sterilized: true,
    vaccinated: true,
    goodWithKids: true,
    goodWithDogs: true,
    status: "ADOPTED",
    description:
      "Bella și-a găsit familia și acum doarme pe canapea, exact cum merită. Mulțumim tuturor celor care au distribuit anunțul!",
    photoUrl:
      "https://images.unsplash.com/photo-1561037404-61cd46aa615b?w=1200&q=80",
    updatedDaysAgo: 20,
  },
  {
    name: "Negruța",
    type: "CAT",
    sex: "FEMALE",
    ageGroup: "YOUNG",
    ageText: "1 an",
    size: "SMALL",
    county: "BH",
    city: "Oradea",
    sterilized: true,
    goodWithCats: true,
    status: "ADOPTED",
    description: "Negruța a fost adoptată de o familie din Oradea. Drum bun, pisicuță!",
    photoUrl:
      "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=1200&q=80",
    updatedDaysAgo: 30,
  },
];

/**
 * Garde anti-collision : le compte démo créé par ce script n'a jamais de
 * ligne Account (ni mot de passe, ni OAuth). S'il en a une, c'est qu'un
 * humain s'est réellement inscrit avec cet email — on ne touche à rien.
 */
async function refuseRealAccount(): Promise<void> {
  const existing = await prisma.user.findUnique({
    where: { email: DEMO_EMAIL },
    select: { _count: { select: { accounts: true } } },
  });
  if (existing && existing._count.accounts > 0) {
    console.error(
      `Le compte ${DEMO_EMAIL} porte un compte de connexion : ce n'est pas ` +
        "celui du seed. Par prudence, rien n'a été modifié.",
    );
    process.exit(1);
  }
}

async function seed(): Promise<void> {
  await refuseRealAccount();
  const user = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    create: { email: DEMO_EMAIL, emailVerified: true, ...DEMO_USER },
    update: DEMO_USER,
  });

  // Ré-exécutable : on repart de zéro côté démo (cascade sur les photos),
  // sans jamais sortir de userId = compte démo.
  const { count: removed } = await prisma.animal.deleteMany({
    where: { userId: user.id },
  });
  if (removed > 0) {
    console.log(`${removed} animaux de démo existants remplacés.`);
  }

  const now = Date.now();
  for (const { photoUrl, updatedDaysAgo, ...animal } of ANIMALS) {
    const updatedAt = new Date(now - updatedDaysAgo * DAY);
    await prisma.animal.create({
      data: {
        ...animal,
        userId: user.id,
        // Dates étagées : la grille (tri par updatedAt) et les libellés
        // « Mis à jour il y a… » montrent une vraie variété.
        createdAt: new Date(updatedAt.getTime() - 3 * DAY),
        updatedAt,
        ...(photoUrl
          ? { photos: { create: { url: photoUrl, position: 0 } } }
          : {}),
      },
    });
  }

  const withPhoto = ANIMALS.filter((a) => a.photoUrl).length;
  const adopted = ANIMALS.filter((a) => a.status === "ADOPTED").length;
  console.log(
    `${ANIMALS.length} animaux de démonstration créés (${withPhoto} avec photo, ` +
      `${ANIMALS.length - withPhoto} sans, ${adopted} adoptés), rattachés à ${DEMO_EMAIL}.`,
  );
  console.log("Annulation intégrale : npm run seed:demo:clean");
}

async function clean(): Promise<void> {
  await refuseRealAccount();
  const user = await prisma.user.findUnique({
    where: { email: DEMO_EMAIL },
    select: { id: true, _count: { select: { animals: true } } },
  });
  if (!user) {
    console.log(`Aucun compte ${DEMO_EMAIL} en base — rien à supprimer.`);
    return;
  }
  // La suppression du compte emporte animaux puis photos par cascade ;
  // le périmètre est exactement « ce qui appartient au compte démo ».
  await prisma.user.delete({ where: { id: user.id } });
  console.log(
    `Compte ${DEMO_EMAIL} supprimé, avec ses ${user._count.animals} animaux et leurs photos.`,
  );
}

const mode = process.argv[2];
try {
  if (mode === undefined) {
    await seed();
  } else if (mode === "clean") {
    await clean();
  } else {
    console.error(`Argument inconnu « ${mode} » — utiliser sans argument (seed) ou « clean ».`);
    process.exitCode = 1;
  }
} finally {
  await prisma.$disconnect();
}
