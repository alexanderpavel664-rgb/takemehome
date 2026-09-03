import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";
import { neon } from "@neondatabase/serverless";

/**
 * Deux rôles, deux préfixes :
 *
 * /cont — contrôle optimiste recommandé par Better Auth : on ne vérifie que
 * la présence du cookie de session (pas d'appel DB). La vérification réelle
 * (auth.api.getSession) est faite dans chaque page protégée — un cookie
 * forgé ne passe pas au-delà de la redirection.
 *
 * /animal/<id> — le VRAI code 404 d'une fiche qui n'existe plus. La fiche a
 * un loading.tsx : sa coquille part en streaming avec un 200 avant que la
 * page ait interrogé la base, et un notFound() lancé ensuite ne peut plus
 * changer le statut (doc Next, loading.js → Status Codes). Un lien Facebook
 * mort renvoyait donc 200 avec le contenu « nu a fost găsit ». La seule
 * place où décider AVANT le streaming, c'est ici. Le coût est tenu : rien
 * pour les navigations internes (RSC, préchargements), un SELECT d'une
 * colonne par chargement HTML, via le pilote HTTP Neon (une requête, pas de
 * connexion à ouvrir) ; en cas de panne du contrôle, la fiche passe — la
 * page reste seule juge du contenu.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/animal/")) {
    return animalGate(request);
  }
  const sessionCookie = getSessionCookie(request);
  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

// Les ids d'Animal sont des cuid Prisma : « c » suivi de 24 [a-z0-9]. Tout
// autre chemin est un 404 sans même interroger la base.
const CUID = /^c[a-z0-9]{24}$/;

// La route qui rend la page « Animalul nu a fost găsit » avec un vrai 404 :
// une page statique qui lance notFound() hors de tout loading.tsx. Rewrite,
// pas redirect : l'URL de la fiche reste dans la barre d'adresse.
const NOT_FOUND_PATH = "/animal/negasit";

// Le pilote HTTP : une requête HTTPS par appel, rien à ouvrir ni à fermer,
// ce qui convient à une fonction qui tourne devant l'application. Créé une
// fois par instance, et seulement quand une fiche est demandée.
let sql: ReturnType<typeof neon> | null = null;
function db() {
  sql ??= neon(process.env.DATABASE_URL!);
  return sql;
}

async function animalGate(request: NextRequest) {
  // Navigation interne ou préchargement (en-tête RSC posé par le routeur
  // Next) : le statut HTTP n'est vu par personne — c'est la page qui rend
  // la limite not-found dans le flux, comme avant. Et c'est ce qui garde
  // les préchargements de la grille à coût nul : vingt cartes à l'écran ne
  // font pas vingt requêtes ici.
  if (request.headers.get("rsc") === "1") {
    return NextResponse.next();
  }
  const [, , id] = request.nextUrl.pathname.split("/");
  if (id === "negasit") {
    return NextResponse.next();
  }
  const notFound = () =>
    NextResponse.rewrite(new URL(NOT_FOUND_PATH, request.url));
  if (!id || !CUID.test(id)) {
    return notFound();
  }
  try {
    const rows = (await db()`SELECT "hidden" FROM "Animal" WHERE "id" = ${id}`) as {
      hidden: boolean;
    }[];
    if (rows.length === 0) {
      return notFound();
    }
    // Annonce masquée : visible de sa propriétaire et d'un ADMIN, un 404
    // pour tout le monde d'autre. Sans cookie de session, personne ne peut
    // être l'un ni l'autre ; avec, c'est la page qui tranche (elle relit la
    // session en base) — le statut sera 200, comme aujourd'hui.
    if (rows[0].hidden && !getSessionCookie(request)) {
      return notFound();
    }
  } catch (error) {
    // Jamais bloquer une fiche parce que le contrôle a échoué : la page
    // fera sa propre requête et dira ce qu'il y a à dire.
    console.error("proxy.animal_gate_failed", error);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/cont/:path*", "/animal/:path*"],
};
