"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { APIError } from "better-auth/api";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isRateLimited } from "@/lib/rate-limit";
import { reportError } from "@/lib/report";
import { STR } from "@/lib/strings";

export type ResetPasswordState =
  | { formError: string; changed?: boolean }
  | { fieldError: "password" | "confirm"; message: string }
  | null;

/**
 * Pose le nouveau mot de passe, puis connecte. Une action serveur plutôt
 * que authClient.resetPassword : la connexion qui suit exige l'email, que
 * le navigateur ne connaît pas (le lien ne porte que le jeton). Ici, le
 * jeton donne l'utilisateur, l'utilisateur donne l'email — lu AVANT
 * l'appel, qui consomme le jeton.
 *
 * Ce chemin ne passe pas par /api/auth, donc pas par la limite better-auth
 * de /reset-password : le WAF (password-reset:<ip>) en tient lieu. Le
 * jeton fait 24 caractères aléatoires — le compteur n'est pas ce qui le
 * protège, il borne juste le bruit.
 *
 * better-auth ne fait qu'un appel : consommer le jeton, hacher, écrire,
 * onPasswordReset (emailVerified), puis supprimer toutes les sessions du
 * compte (revokeSessionsOnPasswordReset). signInEmail ouvre ensuite la
 * nouvelle — le plugin nextCookies pose le cookie depuis une action.
 */
export async function resetPassword(
  _prevState: ResetPasswordState,
  formData: FormData,
): Promise<ResetPasswordState> {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (password.length < 8) {
    return {
      fieldError: "password",
      message: STR.auth.errors.PASSWORD_TOO_SHORT,
    };
  }
  if (password !== confirm) {
    return { fieldError: "confirm", message: STR.profil.passwordMismatch };
  }

  const requestHeaders = await headers();
  if (await isRateLimited("password-reset", requestHeaders)) {
    return { formError: STR.auth.errors.rateLimited };
  }

  const verification = token
    ? await prisma.verification.findFirst({
        where: { identifier: `reset-password:${token}` },
        select: { value: true, expiresAt: true },
      })
    : null;
  if (!verification || verification.expiresAt <= new Date()) {
    return { formError: STR.auth.errors.INVALID_TOKEN };
  }
  // value = l'id de l'utilisateur (better-auth, routes/password).
  const user = await prisma.user.findUnique({
    where: { id: verification.value },
    select: { id: true, email: true },
  });
  if (!user) {
    return { formError: STR.auth.errors.INVALID_TOKEN };
  }

  try {
    await auth.api.resetPassword({
      body: { newPassword: password, token },
      headers: requestHeaders,
    });
  } catch (error) {
    if (error instanceof APIError) {
      const code = error.body?.code;
      if (code === "PASSWORD_TOO_SHORT" || code === "PASSWORD_TOO_LONG") {
        return { fieldError: "password", message: STR.auth.errors[code] };
      }
      if (code === "INVALID_TOKEN") {
        return { formError: STR.auth.errors.INVALID_TOKEN };
      }
    }
    await reportError("password_reset.failed", error, { userId: user.id });
    return { formError: STR.auth.errors.fallback };
  }

  try {
    await auth.api.signInEmail({
      body: { email: user.email, password },
      headers: requestHeaders,
    });
  } catch (error) {
    // Le mot de passe EST changé : dire que c'est fait et où aller, pas
    // « ceva n-a mers bine » à quelqu'un qui recommencerait pour rien.
    await reportError("password_reset.sign_in_failed", error, {
      userId: user.id,
    });
    return {
      formError: STR.auth.resetPassword.changedSignInFailed,
      changed: true,
    };
  }

  // redirect() hors des try : il fonctionne en levant une exception.
  redirect("/cont");
}
