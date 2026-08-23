"use server";

import { redirect } from "next/navigation";
import { TERMS_VERSION } from "@/lib/legal";
import { prisma } from "@/lib/prisma";
import { reportError } from "@/lib/report";
import { STR } from "@/lib/strings";
import { getSession } from "@/lib/viewer";

export type AcceptTermsState = { formError: string } | null;

/**
 * L'acceptation après coup — comptes créés avant la règle, ou avec Google
 * depuis /login, où il n'y a pas de case. La case est revalidée ici : une
 * server action est joignable par POST direct, et une ligne
 * termsAcceptedAt posée sans clic ne vaudrait rien.
 *
 * Écrit par Prisma et non par better-auth : termsAcceptedAt est déclaré
 * input: false dans auth.ts, /update-user le refuserait — c'est voulu.
 */
export async function acceptTerms(
  _prevState: AcceptTermsState,
  formData: FormData,
): Promise<AcceptTermsState> {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  if (formData.get("accept") !== "on") {
    return { formError: STR.auth.register.termsRequired };
  }

  // redirect() reste HORS du try : il fonctionne en levant une exception.
  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { termsAcceptedAt: new Date(), termsVersion: TERMS_VERSION },
    });
  } catch (error) {
    // La cause doit être lisible dans Sentry et dans la ligne de log sans
    // ouvrir la pile : le message d'une erreur Prisma commence par un
    // extrait de code de plusieurs centaines de caractères, et la phrase
    // qui compte (« Unknown argument… », « column … does not exist ») est
    // à la FIN — au-delà des 500 caractères que le log conserve. On la
    // remonte à part, avec le code Prisma quand il y en a un.
    await reportError("terms.accept_failed", error, {
      userId: session.user.id,
      prismaCode: prismaErrorCode(error),
      reason: errorReason(error),
    });
    return { formError: STR.auth.acceptTerms.failed };
  }

  redirect("/cont");
}

/** Code d'une erreur Prisma connue (P2025, P2022…), sinon « none ». */
function prismaErrorCode(error: unknown): string {
  return error !== null &&
    typeof error === "object" &&
    "code" in error &&
    typeof error.code === "string"
    ? error.code
    : "none";
}

/** La dernière ligne non vide du message : chez Prisma, c'est la cause. */
function errorReason(error: unknown): string {
  if (!(error instanceof Error)) {
    return String(error);
  }
  const lines = error.message
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  return lines[lines.length - 1] ?? error.name;
}
