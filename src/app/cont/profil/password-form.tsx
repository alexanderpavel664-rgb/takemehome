"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { authErrorMessage } from "@/lib/auth-errors";
import { STR } from "@/lib/strings";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/field";

/**
 * Changement de mot de passe : l'ancien, le nouveau, sa répétition. C'est
 * le geste de quelqu'un qui doute de son compte — d'où revokeOtherSessions :
 * qui a volé une session la perd à l'instant où la personne reprend la main.
 *
 * L'ancien mot de passe est vérifié par better-auth (/change-password), et
 * ce chemin a sa propre limite de débit (auth.ts) : pour un voleur de
 * session, c'est une oracle du mot de passe.
 *
 * Compte sans mot de passe local (Google seul) : la section le dit et
 * s'arrête là — setPassword n'est pas exposé au navigateur, et une
 * personne qui entre avec Google n'a rien à changer ici.
 */
export function PasswordSection({ hasPassword }: { hasPassword: boolean }) {
  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold text-warm-ink">
        {STR.profil.passwordTitle}
      </h2>
      <Card className="mt-4 p-4">
        {hasPassword ? (
          <PasswordForm />
        ) : (
          <p className="max-w-[60ch] text-base text-warm-gray">
            {STR.profil.passwordGoogleOnly}
          </p>
        )}
      </Card>
    </section>
  );
}

function PasswordForm() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  // Les erreurs vivent sous leur champ ; seule l'erreur réseau reste globale.
  const [currentError, setCurrentError] = useState<string | null>(null);
  const [nextError, setNextError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCurrentError(null);
    setNextError(null);
    setConfirmError(null);
    setError(null);
    setSaved(false);
    if (next === current) {
      setNextError(STR.profil.passwordUnchanged);
      return;
    }
    if (next !== confirm) {
      setConfirmError(STR.profil.passwordMismatch);
      return;
    }
    setPending(true);
    const { error } = await authClient.changePassword({
      currentPassword: current,
      newPassword: next,
      revokeOtherSessions: true,
    });
    setPending(false);
    if (error) {
      // Mauvais ancien mot de passe : sous son champ. Tout le reste
      // (longueur, limite de débit, panne) : en bas, en toutes lettres.
      const message = authErrorMessage(error);
      if (error.code === "INVALID_PASSWORD") {
        setCurrentError(message);
      } else if (
        error.code === "PASSWORD_TOO_SHORT" ||
        error.code === "PASSWORD_TOO_LONG"
      ) {
        setNextError(message);
      } else {
        setError(message);
      }
      return;
    }
    setCurrent("");
    setNext("");
    setConfirm("");
    setSaved(true);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <p className="max-w-[60ch] text-sm text-warm-gray">
        {STR.profil.passwordIntro}
      </p>
      {/* autoComplete : le gestionnaire de mots de passe remplit l'ancien
          et propose un nouveau — sans ces valeurs il devine, souvent mal. */}
      <Input
        label={STR.profil.currentPassword}
        name="currentPassword"
        type="password"
        autoComplete="current-password"
        value={current}
        onChange={(e) => setCurrent(e.target.value)}
        required
        error={currentError ?? undefined}
      />
      <Input
        label={STR.profil.newPassword}
        name="newPassword"
        type="password"
        autoComplete="new-password"
        value={next}
        onChange={(e) => setNext(e.target.value)}
        required
        minLength={8}
        error={nextError ?? undefined}
      />
      <Input
        label={STR.profil.confirmPassword}
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        required
        minLength={8}
        error={confirmError ?? undefined}
      />
      {error && (
        <p role="alert" className="text-sm font-semibold text-warm-ink">
          {error}
        </p>
      )}
      {saved && (
        <p role="status" className="text-sm text-warm-ink">
          {STR.profil.passwordChanged}
        </p>
      )}
      {/* outline et non primary : le bouton plein de cet écran est
          « Salvează », sur le formulaire de profil (La Règle du Bouton
          Unique). */}
      <Button type="submit" variant="outline" disabled={pending}>
        {pending ? STR.profil.changePasswordPending : STR.profil.changePassword}
      </Button>
    </form>
  );
}
