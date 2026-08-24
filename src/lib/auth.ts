import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { isEmailConfigured, sendEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { reportError } from "@/lib/report";
import { STR } from "@/lib/strings";
import { isAcceptedVersion, TERMS_COOKIE } from "@/lib/terms";

// secret et baseURL sont lus automatiquement depuis BETTER_AUTH_SECRET / BETTER_AUTH_URL.
export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    // Reste à false tant que la vérification d'email n'est pas ACTIVÉE
    // (voir emailVerification ci-dessous) : à true, un compte non vérifié ne
    // peut plus se connecter — et sans email envoyé, il ne le sera jamais.
    // C'est la seconde bascule, à tourner seulement après la première, une
    // fois l'envoi observé en production.
    requireEmailVerification: false,
    minPasswordLength: 8,
    // ——— Réinitialisation de mot de passe (« Ai uitat parola? »). ———
    //
    // Même tuyau que la vérification d'email, mêmes conditions : sans
    // RESEND_API_KEY + EMAIL_FROM, sendResetPassword est absent et
    // /request-password-reset répond RESET_PASSWORD_DISABLED. Le chemin :
    // /parola-uitata → /request-password-reset (via /api/auth, où le WAF
    // compte password-reset:<ip>) → email → /api/auth/reset-password/<jeton>
    // → /parola-noua?token= (ou ?error=INVALID_TOKEN) → action serveur qui
    // pose le mot de passe puis connecte → /cont.
    sendResetPassword: isEmailConfigured()
      ? async ({ user, url }) => {
          try {
            // Compte entré par Google seul : aucun mot de passe à
            // réinitialiser. On le dit DANS l'email — le seul endroit où
            // on peut le dire sans révéler à la page que l'adresse a un
            // compte, ni comment il se connecte. Le jeton créé par
            // better-auth n'est envoyé nulle part : il expire sans usage.
            const credential = await prisma.account.findFirst({
              where: { userId: user.id, providerId: "credential" },
              select: { id: true },
            });
            if (!credential) {
              await sendEmail({
                to: user.email,
                subject: STR.email.resetPasswordGoogle.subject,
                text: STR.email.resetPasswordGoogle.body(
                  user.name,
                  new URL("/login", url).href,
                ),
              });
              return;
            }
            await sendEmail({
              to: user.email,
              subject: STR.email.resetPassword.subject,
              text: STR.email.resetPassword.body(user.name, url),
            });
          } catch (error) {
            // Comme pour la vérification : better-auth logue et continue,
            // la page affiche « dacă adresa are un cont… » — sans cette
            // alerte, une association bloquée dehors le resterait sans
            // qu'on le sache.
            await reportError("email.password_reset_send_failed", error, {
              userId: user.id,
            });
          }
        }
      : undefined,
    // 1 h (le défaut better-auth, écrit pour être lu) : contrairement à la
    // vérification (24 h, ouverte le lendemain), la personne attend ce
    // lien devant le formulaire. Une heure couvre une boîte mail lente et
    // un dossier spam ; au-delà, un lien qui traîne dans une boîte mal
    // fermée n'a plus de raison d'ouvrir un compte. Redemander coûte un
    // clic. Le texte de l'email (STR.email.resetPassword) dit « o oră ».
    resetPasswordTokenExpiresIn: 60 * 60,
    // Le pendant du revokeOtherSessions du profil : qui réinitialise son
    // mot de passe reprend la main sur son compte, et toute session
    // ouverte ailleurs (vol compris) se ferme. L'action de /parola-noua
    // ouvre ensuite la sienne.
    revokeSessionsOnPasswordReset: true,
    // Ouvrir le lien reçu prouve le contrôle de la boîte : c'est exactement
    // ce que la vérification d'email prouve. Un compte qui réinitialise
    // n'a plus à reconfirmer son adresse.
    onPasswordReset: async ({ user }) => {
      if (user.emailVerified) return;
      await prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: true },
      });
    },
  },
  // ——— Vérification d'email : le terrain est prêt, rien n'est actif. ———
  //
  // Tout est branché mais conditionné à isEmailConfigured(), c'est-à-dire
  // aux variables RESEND_API_KEY et EMAIL_FROM. Tant qu'elles manquent,
  // better-auth ne reçoit pas de bloc emailVerification et se comporte
  // exactement comme aujourd'hui. Pour activer, dans l'ordre :
  //
  //   1. Chez Resend : ajouter le domaine (takemehome.ro) et poser ses
  //      enregistrements DNS (SPF, DKIM, le MX de retour) ; attendre le
  //      statut « verified ».
  //   2. (Fait le 24 août 2026, TERMS_VERSION « 2026-08-24 ».) Mettre à
  //      jour /confidentialitate AVANT la mise en service : Resend aux
  //      points 2, 3 et 4, TERMS_VERSION + updatedLabel dans lib/legal.ts.
  //   3. Poser RESEND_API_KEY et EMAIL_FROM sur Vercel (production), et
  //      dans .env.local pour tester en dev. PUIS REDÉMARRER : la condition
  //      isEmailConfigured() ci-dessous est évaluée UNE FOIS, à la
  //      construction de `auth`. next dev recharge .env.local mais pas ce
  //      module ; Vercel n'applique une variable qu'aux déploiements
  //      postérieurs à son ajout. (Constaté le 24 août 2026 : « No sent
  //      emails yet » avec les variables posées — un redémarrage a suffi.)
  //   4. Créer un compte de test : l'email part à l'inscription
  //      (sendOnSignUp), le lien ouvre /api/auth/verify-email puis redirige
  //      vers callbackURL (/cont/profil). /cont affiche le bandeau
  //      « Confirmă-ți adresa » avec « Retrimite » tant que emailVerified
  //      est faux — y compris pour les comptes créés avant l'activation.
  //   5. Une fois l'envoi observé : passer requireEmailVerification à true
  //      (ci-dessus) si l'on veut bloquer la connexion des comptes non
  //      vérifiés, et revoir requireLocalEmailVerified (plus bas).
  //
  // La réinitialisation de mot de passe vit dans emailAndPassword
  // (sendResetPassword, ci-dessus) : même tuyau, mêmes conditions.
  emailVerification: isEmailConfigured()
    ? {
        sendVerificationEmail: async ({ user, url }) => {
          try {
            await sendEmail({
              to: user.email,
              subject: STR.email.verify.subject,
              text: STR.email.verify.body(user.name, url),
            });
          } catch (error) {
            // better-auth avalerait l'exception en arrière-plan : on alerte
            // nous-mêmes. Un email de vérification qui ne part pas est une
            // inscription qui n'aboutit pas.
            await reportError("email.verification_send_failed", error, {
              userId: user.id,
            });
          }
        },
        sendOnSignUp: true,
        autoSignInAfterVerification: true,
        // 24 h : l'email est souvent ouvert le lendemain, sur un autre appareil.
        expiresIn: 60 * 60 * 24,
      }
    : undefined,
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
      // Le changement de mot de passe vérifie l'ANCIEN : pour qui a volé une
      // session, c'est une oracle du mot de passe. Même budget qu'un login.
      "/change-password": { window: 900, max: 5 },
      // Chaque appel envoie un email : trois par quart d'heure suffisent à
      // qui n'a pas reçu le premier, et arrêtent qui voudrait en inonder un.
      "/send-verification-email": { window: 900, max: 3 },
      // Même logique : un email par appel. S'ajoute au compteur WAF
      // password-reset:<ip> (20 / 60 s, route.ts) : le WAF arrête la
      // rafale, ce compteur arrête la goutte-à-goutte sur un quart d'heure.
      "/request-password-reset": { window: 900, max: 3 },
      // Le jeton fait 24 caractères aléatoires : indevinable, mais une
      // pose de mot de passe n'a pas à être plus large qu'un login.
      "/reset-password": { window: 900, max: 5 },
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
      // vérification d'email sera active (étape 5 du commentaire ci-dessus).
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
      // Consentement à l'affichage public des coordonnées. Déclaré ici —
      // donc écrivable par /update-user — parce que c'est justement la
      // personne concernée qui doit pouvoir le donner ET le retirer, aussi
      // facilement l'un que l'autre (RGPD art. 7(3)). defaultValue: false
      // vaut pour les comptes créés après cette migration ; les comptes
      // existants héritent du DEFAULT false de la colonne.
      contactConsent: {
        type: "boolean",
        required: false,
        defaultValue: false,
      },
      // Acceptation des conditions : déclarés pour que la SESSION les porte
      // (la porte de /cont les lit sans requête), mais input: false — un
      // corps de requête qui tenterait de les poser est refusé
      // (FIELD_NOT_ALLOWED). Seuls le hook ci-dessous et l'action de
      // /accepta-termenii les écrivent.
      termsAcceptedAt: { type: "date", required: false, input: false },
      termsVersion: { type: "string", required: false, input: false },
    },
  },
  databaseHooks: {
    user: {
      create: {
        // La case cochée sur /inregistrare arrive ici par le cookie
        // tmh_terms (lib/terms.ts) — le même chemin pour l'inscription par
        // email et pour Google, dont l'aller-retour OAuth ne transporte
        // aucun corps de requête. Sans cookie, on n'invente rien : la ligne
        // naît avec termsAcceptedAt NULL et l'espace compte renverra vers
        // /accepta-termenii. Une fausse date ne prouverait rien.
        before: async (user, ctx) => {
          const version = ctx?.getCookie(TERMS_COOKIE) ?? null;
          if (!isAcceptedVersion(version)) {
            return;
          }
          return {
            data: { ...user, termsAcceptedAt: new Date(), termsVersion: version },
          };
        },
      },
    },
  },
  // nextCookies doit rester le dernier plugin de la liste.
  plugins: [nextCookies()],
});
