import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "@/lib/prisma";

// secret et baseURL sont lus automatiquement depuis BETTER_AUTH_SECRET / BETTER_AUTH_URL.
export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    // Pas de service d'envoi d'email en phase 2 (pas de domaine) :
    // ni vérification d'email, ni réinitialisation de mot de passe.
    requireEmailVerification: false,
    minPasswordLength: 8,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  // Limite de débit — better-auth ne l'active qu'en production (NODE_ENV).
  // Les compteurs vivent en base (table rateLimit) : la mémoire d'une
  // fonction serverless ne survit pas entre invocations.
  rateLimit: {
    storage: "database",
    // La fenêtre globale sert AUSSI de seuil de purge des compteurs expirés,
    // et la purge ignore les fenêtres des customRules : plus courte que 900,
    // elle réarmerait les 5 tentatives de sign-in avant les 15 minutes.
    window: 900,
    // Le reste des endpoints auth : 100 requêtes / 15 min / IP / chemin.
    max: 100,
    customRules: {
      "/sign-in/email": { window: 900, max: 5 },
      "/sign-up/email": { window: 900, max: 5 },
      // Le départ OAuth ne vérifie pas de mot de passe : un peu plus large.
      "/sign-in/social": { window: 900, max: 10 },
      // Personne ne l'appelle côté client aujourd'hui, mais si un useSession
      // arrive, le chemin le plus chaud ne doit pas coûter 2 requêtes Neon
      // de plus par appel.
      "/get-session": false,
    },
  },
  advanced: {
    ipAddress: {
      // Vercel écrase x-forwarded-for à son bord (anti-usurpation) ; le
      // x-vercel-forwarded-for reste posé même si un proxy tiers s'intercale
      // un jour devant.
      ipAddressHeaders: ["x-vercel-forwarded-for", "x-forwarded-for"],
    },
  },
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google"],
      // Sans envoi d'email, les comptes mot de passe restent emailVerified=false ;
      // sans ce flag, leur retour via "Se connecter avec Google" échouerait en
      // account_not_linked malgré trustedProviders. À réévaluer quand la
      // vérification d'email arrivera (avec le domaine + Resend).
      requireLocalEmailVerified: false,
    },
  },
  user: {
    // Champs métier des refuges, portés par la table User fusionnée.
    // input: true (défaut) : modifiables via updateUser depuis le client.
    additionalFields: {
      phone: { type: "string", required: false },
      publicEmail: { type: "string", required: false },
      county: { type: "string", required: false },
      city: { type: "string", required: false },
      description: { type: "string", required: false },
    },
  },
  // nextCookies doit rester le dernier plugin de la liste.
  plugins: [nextCookies()],
});
