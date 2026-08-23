"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { authErrorMessage } from "@/lib/auth-errors";
import { STR } from "@/lib/strings";
import { rememberTermsAcceptance } from "@/lib/terms";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox, Input } from "@/components/ui/field";
import { TermsLabel } from "@/components/terms-label";

export function RegisterForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // Jamais pré-cochée : des conditions acceptées par défaut ne sont pas
  // acceptées du tout (CJUE Planet49, C-673/17).
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsError, setTermsError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  // Le même verrou devant les deux portes, email et Google : sans la case,
  // rien ne part. Avec, le cookie tmh_terms porte l'acceptation jusqu'à la
  // création du compte — c'est le hook user.create.before (auth.ts) qui
  // l'inscrit en base, pour les deux chemins.
  function ensureTermsAccepted(): boolean {
    if (!termsAccepted) {
      setTermsError(STR.auth.register.termsRequired);
      return false;
    }
    rememberTermsAcceptance();
    return true;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!ensureTermsAccepted()) {
      return;
    }
    setPending(true);
    const { error } = await authClient.signUp.email({
      name: name.trim(),
      email: email.trim(),
      password,
      // Destination du lien de vérification d'email, le jour où l'envoi
      // sera actif (auth.ts) ; sans effet d'ici là.
      callbackURL: "/cont/profil",
    });
    if (error) {
      setError(authErrorMessage(error));
      setPending(false);
      return;
    }
    // Vers le profil, pas /cont : le contact du profil est ce qui s'affiche
    // sur les fiches — il doit être rempli dès l'inscription.
    router.push("/cont/profil");
  }

  async function onGoogle() {
    setError(null);
    if (!ensureTermsAccepted()) {
      return;
    }
    // signIn.social ne lance jamais d'exception : l'échec arrive dans { error }.
    // Compte Google inconnu = première inscription : même destination /cont/profil.
    const { error } = await authClient.signIn.social({
      provider: "google",
      callbackURL: "/cont",
      newUserCallbackURL: "/cont/profil",
      errorCallbackURL: "/login?error=google",
    });
    if (error) {
      setError(STR.auth.login.googleFailed);
    }
  }

  return (
    // Carte ivoire centrée sur le papier crème, avec de l'air au-dessus —
    // le formulaire ne s'étire jamais sur toute la largeur.
    <main className="px-4 pt-10 pb-10 md:px-6 md:pt-16 lg:px-8">
      <Card className="mx-auto w-full max-w-md p-6">
        <h1 className="text-2xl font-semibold text-warm-ink">
          {STR.auth.register.title}
        </h1>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <Input
            label={STR.auth.register.name}
            name="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            label={STR.auth.register.email}
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label={STR.auth.register.password}
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
          {/* La case vaut pour les deux chemins, email et Google : elle est
              posée AVANT le bouton plein et au-dessus de la hairline qui
              sépare Google, pour qu'on la lise comme la condition des deux.
              Pas d'attribut required : la bulle du navigateur ne couvrirait
              pas le bouton Google, qui n'est pas une soumission. */}
          <Checkbox
            name="terms"
            label={<TermsLabel />}
            checked={termsAccepted}
            onChange={(e) => {
              setTermsAccepted(e.target.checked);
              if (e.target.checked) setTermsError(null);
            }}
            error={termsError ?? undefined}
          />
          {/* Erreur globale par nature (compte existant, échec Google) :
              en toutes lettres sous les champs — la palette n'a pas de rouge. */}
          {error && (
            <p role="alert" className="text-sm font-semibold text-warm-ink">
              {error}
            </p>
          )}
          <Button
            type="submit"
            variant="primary"
            className="w-full"
            disabled={pending}
          >
            {pending
              ? STR.auth.register.submitPending
              : STR.auth.register.submit}
          </Button>
        </form>
        {/* Google, séparé du formulaire email par une hairline douce. */}
        <div className="mt-6 border-t border-warm-border pt-6">
          <Button className="w-full" onClick={onGoogle}>
            {STR.auth.login.google}
          </Button>
        </div>
        <p className="mt-4 text-sm text-warm-gray">
          {STR.auth.register.hasAccount}{" "}
          <Link
            href="/login"
            className="inline-flex min-h-11 items-center text-warm-ink underline underline-offset-4"
          >
            {STR.auth.register.signIn}
          </Link>
        </p>
      </Card>
    </main>
  );
}
