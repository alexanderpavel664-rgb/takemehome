import { cache } from "react";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getSessionCookie } from "better-auth/cookies";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@/generated/prisma/client";

/**
 * La session du rendu en cours, lue une seule fois par requête.
 *
 * `cache` : le layout de /cont (porte des conditions), la page et une
 * éventuelle action partagent le même aller-retour Neon. Sans cookie de
 * session, on rend la main AVANT d'interroger la base — c'est le cas de
 * 99 % des visiteurs des pages publiques, et il doit rester à coût nul.
 */
export const getSession = cache(async () => {
  const requestHeaders = await headers();
  if (!getSessionCookie(requestHeaders)) {
    return null;
  }
  return auth.api.getSession({ headers: requestHeaders });
});

/**
 * Qui regarde — avec les deux champs que la session ne porte pas : le rôle
 * et la suspension.
 *
 * Ils sont lus en base à chaque fois, et JAMAIS déclarés dans les
 * additionalFields de better-auth : ce qui n'y est pas déclaré est ignoré
 * par /update-user et /sign-up (parseInputData n'itère que sur les champs
 * déclarés). Aucun corps de requête venu du navigateur ne peut donc écrire
 * `role: "ADMIN"` — il n'existe aucun chemin d'escalade par l'interface,
 * le rôle se pose à la main en base.
 */
export type Viewer = {
  id: string;
  role: UserRole;
  suspended: boolean;
};

/** `cache` : plusieurs appels dans le même rendu ne coûtent qu'une requête. */
export const getViewer = cache(async (): Promise<Viewer | null> => {
  const session = await getSession();
  if (!session) {
    return null;
  }
  return prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true, suspended: true },
  });
});

/**
 * Porte de /admin et de ses actions. Un non-ADMIN — visiteur anonyme
 * compris — reçoit un 404, jamais un 403 : un 403 confirmerait que la page
 * existe. Pour la même raison /admin n'est pas dans le matcher du proxy,
 * qui redirigerait vers /login et dirait ainsi qu'il y a quelque chose là.
 */
export async function requireAdmin(): Promise<Viewer> {
  const viewer = await getViewer();
  if (viewer?.role !== "ADMIN") {
    notFound();
  }
  return viewer;
}
