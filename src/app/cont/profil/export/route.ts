import { prisma } from "@/lib/prisma";
import { getViewer } from "@/lib/viewer";

/**
 * Export des données personnelles — RGPD art. 15 (copie) et art. 20
 * (portabilité), en JSON lisible par un humain comme par une machine.
 *
 * Une route GET et non une server action : le navigateur télécharge le
 * fichier lui-même grâce à Content-Disposition, sans une ligne de
 * JavaScript, sans Blob ni URL.createObjectURL. Un simple <a href>, qui
 * marche aussi quand le JS n'a pas chargé.
 *
 * Elle vit sous /cont : le proxy garde déjà tout ce préfixe, et la session
 * est revérifiée ici de toute façon.
 *
 * CE QUI N'EST VOLONTAIREMENT PAS DEDANS : le hash du mot de passe et les
 * jetons OAuth de la table Account. Ce ne sont pas des données « fournies
 * par la personne concernée » au sens de l'art. 20, et un export qui les
 * contiendrait transformerait un fichier qu'on s'envoie par email en
 * trousseau de clés. Le fait qu'un compte Google soit rattaché, lui, est
 * une information qui lui appartient : il figure, sans les jetons.
 */
export async function GET(): Promise<Response> {
  const viewer = await getViewer();
  if (!viewer) {
    // Pas de redirection vers /login : ce n'est pas une page, et un
    // téléchargement qui rendrait la page de connexion en JSON n'aiderait
    // personne. Le proxy a déjà redirigé les navigations ordinaires.
    return new Response(null, { status: 401 });
  }

  const [user, animals, sessions, accounts] = await Promise.all([
    prisma.user.findUnique({
      where: { id: viewer.id },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        image: true,
        phone: true,
        publicEmail: true,
        county: true,
        city: true,
        description: true,
        contactConsent: true,
        role: true,
        suspended: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.animal.findMany({
      where: { userId: viewer.id },
      orderBy: { createdAt: "asc" },
      include: {
        photos: {
          orderBy: { position: "asc" },
          select: { url: true, position: true, createdAt: true },
        },
      },
    }),
    // Les métadonnées de session SONT des données personnelles (IP et
    // user-agent) : elles doivent figurer dans une demande d'accès. Le jeton,
    // lui, est une clé — il reste dehors.
    prisma.session.findMany({
      where: { userId: viewer.id },
      orderBy: { createdAt: "asc" },
      select: {
        createdAt: true,
        updatedAt: true,
        expiresAt: true,
        ipAddress: true,
        userAgent: true,
      },
    }),
    prisma.account.findMany({
      where: { userId: viewer.id },
      orderBy: { createdAt: "asc" },
      select: { providerId: true, createdAt: true, updatedAt: true },
    }),
  ]);

  if (!user) {
    return new Response(null, { status: 404 });
  }

  const payload = {
    exportedAt: new Date().toISOString(),
    // Une note en roumain dans le fichier : celui qui l'ouvre six mois plus
    // tard n'aura pas cette page sous les yeux.
    note: "Datele tale de pe TakeMeHome. Parola și jetoanele de autentificare nu sunt incluse, din motive de securitate.",
    cont: user,
    animale: animals,
    sesiuni: sessions,
    autentificari: accounts,
  };

  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": 'attachment; filename="takemehome-datele-mele.json"',
      // Ne doit jamais être mis en cache : ni par le navigateur, ni par un
      // intermédiaire. Le service worker laisse déjà passer cette route
      // (NetworkOnly par défaut), mais la consigne s'écrit quand même.
      "Cache-Control": "no-store",
    },
  });
}
