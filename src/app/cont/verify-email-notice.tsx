"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { STR } from "@/lib/strings";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

/**
 * « Confirmă-ți adresa de email » — rendu par /cont seulement quand l'envoi
 * d'email est configuré (lib/email.ts) ET que emailVerified est faux.
 * Aujourd'hui l'envoi n'est pas configuré : ce composant n'apparaît nulle
 * part. Il est là pour que l'activation (voir auth.ts) ne demande aucune
 * ligne d'interface de plus.
 *
 * Même langage que les autres avertissements : bordure encre épaissie,
 * message en toutes lettres, jamais la couleur seule.
 */
export function VerifyEmailNotice({ email }: { email: string }) {
  const [status, setStatus] = useState<"idle" | "pending" | "sent" | "failed">(
    "idle",
  );

  async function onResend() {
    setStatus("pending");
    const { error } = await authClient.sendVerificationEmail({
      email,
      callbackURL: "/cont",
    });
    setStatus(error ? "failed" : "sent");
  }

  return (
    <Card role="status" className="mt-4 border-[1.5px] border-warm-ink p-4">
      <h2 className="text-lg font-semibold text-warm-ink">
        {STR.cont.verifyEmail.title}
      </h2>
      <p className="mt-1 max-w-[66ch] text-base text-warm-ink">
        {STR.cont.verifyEmail.description(email)}
      </p>
      {status === "sent" && (
        <p className="mt-2 text-sm text-warm-ink">{STR.cont.verifyEmail.resent}</p>
      )}
      {status === "failed" && (
        <p role="alert" className="mt-2 text-sm font-semibold text-warm-ink">
          {STR.cont.verifyEmail.resendFailed}
        </p>
      )}
      <Button
        variant="outline"
        className="mt-3"
        onClick={onResend}
        disabled={status === "pending"}
      >
        {status === "pending"
          ? STR.cont.verifyEmail.resendPending
          : STR.cont.verifyEmail.resend}
      </Button>
    </Card>
  );
}
