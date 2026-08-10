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
