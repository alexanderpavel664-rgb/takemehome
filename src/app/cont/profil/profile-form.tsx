"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { COUNTIES } from "@/lib/counties";

type ProfileValues = {
  name: string;
  phone: string;
  publicEmail: string;
  county: string;
  city: string;
  description: string;
};

export function ProfileForm({ initial }: { initial: ProfileValues }) {
  const router = useRouter();
  const [values, setValues] = useState<ProfileValues>(initial);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);

  function set<K extends keyof ProfileValues>(key: K, value: string) {
    setValues((v) => ({ ...v, [key]: value }));
    setSaved(false);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    if (!values.name.trim()) {
      setError("Le nom du refuge est obligatoire.");
      return;
    }
    setPending(true);
    const { error } = await authClient.updateUser({
      name: values.name.trim(),
      phone: values.phone.trim(),
      publicEmail: values.publicEmail.trim(),
      county: values.county,
      city: values.city.trim(),
      description: values.description.trim(),
    });
    setPending(false);
    if (error) {
      setError("L'enregistrement a échoué. Réessaie.");
      return;
    }
    setSaved(true);
    // Rafraîchit les valeurs rendues côté serveur (page /cont/profil et /cont).
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit}>
      <p>
        <label htmlFor="name">Nom du refuge</label>
        <br />
        <input
          id="name"
          type="text"
          value={values.name}
          onChange={(e) => set("name", e.target.value)}
          required
        />
      </p>
      <p>
        <label htmlFor="phone">Téléphone</label>
        <br />
        <input
          id="phone"
          type="tel"
          value={values.phone}
          onChange={(e) => set("phone", e.target.value)}
        />
      </p>
      <p>
        <label htmlFor="publicEmail">Email public de contact</label>
        <br />
        <input
          id="publicEmail"
          type="email"
          value={values.publicEmail}
          onChange={(e) => set("publicEmail", e.target.value)}
        />
      </p>
      <p>
        <label htmlFor="county">Județ</label>
        <br />
        <select
          id="county"
          value={values.county}
          onChange={(e) => set("county", e.target.value)}
        >
          <option value="">— Choisir un județ —</option>
          {COUNTIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </select>
      </p>
      <p>
        <label htmlFor="city">Ville</label>
        <br />
        <input
          id="city"
          type="text"
          value={values.city}
          onChange={(e) => set("city", e.target.value)}
        />
      </p>
      <p>
        <label htmlFor="description">Description du refuge</label>
        <br />
        <textarea
          id="description"
          value={values.description}
          onChange={(e) => set("description", e.target.value)}
          rows={5}
        />
      </p>
      {error && <p role="alert">{error}</p>}
      {saved && <p role="status">Profil mis à jour.</p>}
      <p>
        <button type="submit" disabled={pending}>
          {pending ? "Enregistrement…" : "Enregistrer"}
        </button>
      </p>
    </form>
  );
}
