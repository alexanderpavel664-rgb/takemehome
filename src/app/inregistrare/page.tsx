"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { authErrorMessage } from "@/lib/auth-errors";

export default function InregistrarePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const { error } = await authClient.signUp.email({
      name: name.trim(),
      email: email.trim(),
      password,
    });
    if (error) {
      setError(authErrorMessage(error.code));
      setPending(false);
      return;
    }
    router.push("/cont");
  }

  async function onGoogle() {
    setError(null);
    // signIn.social ne lance jamais d'exception : l'échec arrive dans { error }.
    const { error } = await authClient.signIn.social({
      provider: "google",
      callbackURL: "/cont",
      errorCallbackURL: "/login?error=google",
    });
    if (error) {
      setError("La connexion avec Google a échoué. Réessaie.");
    }
  }

  return (
    <main>
      <h1>Créer un compte refuge</h1>
      <form onSubmit={onSubmit}>
        <p>
          <label htmlFor="name">Nom du refuge</label>
          <br />
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </p>
        <p>
          <label htmlFor="email">Email</label>
          <br />
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </p>
        <p>
          <label htmlFor="password">Mot de passe (8 caractères minimum)</label>
          <br />
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
        </p>
        {error && <p role="alert">{error}</p>}
        <p>
          <button type="submit" disabled={pending}>
            {pending ? "Création en cours…" : "Créer le compte"}
          </button>
        </p>
      </form>
      <p>
        <button type="button" onClick={onGoogle}>
          Se connecter avec Google
        </button>
      </p>
      <p>
        Déjà un compte ? <Link href="/login">Se connecter</Link>
      </p>
    </main>
  );
}
