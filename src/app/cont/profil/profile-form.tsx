"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { COUNTIES } from "@/lib/counties";
import { STR } from "@/lib/strings";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/field";

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
  // L'erreur de validation vit sous son champ (prop error) ; seule l'erreur
  // réseau reste globale.
  const [nameError, setNameError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);

  function set<K extends keyof ProfileValues>(key: K, value: string) {
    setValues((v) => ({ ...v, [key]: value }));
    setSaved(false);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setNameError(null);
    setError(null);
    setSaved(false);
    if (!values.name.trim()) {
      setNameError(STR.profil.nameRequired);
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
      setError(STR.profil.saveFailed);
      return;
    }
    setSaved(true);
    // Rafraîchit les valeurs rendues côté serveur (page /cont/profil et /cont).
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Input
        label={STR.profil.name}
        name="name"
        type="text"
        value={values.name}
        onChange={(e) => set("name", e.target.value)}
        required
        error={nameError ?? undefined}
      />
      <Input
        label={STR.profil.phone}
        name="phone"
        type="tel"
        value={values.phone}
        onChange={(e) => set("phone", e.target.value)}
      />
      <Input
        label={STR.profil.publicEmail}
        name="publicEmail"
        type="email"
        value={values.publicEmail}
        onChange={(e) => set("publicEmail", e.target.value)}
      />
      <Select
        label={STR.profil.county}
        name="county"
        value={values.county}
        onChange={(e) => set("county", e.target.value)}
      >
        <option value="">{STR.profil.countyPlaceholder}</option>
        {COUNTIES.map((c) => (
          <option key={c.code} value={c.code}>
            {c.name}
          </option>
        ))}
      </Select>
      <Input
        label={STR.profil.city}
        name="city"
        type="text"
        value={values.city}
        onChange={(e) => set("city", e.target.value)}
      />
      <Textarea
        label={STR.profil.description}
        name="description"
        value={values.description}
        onChange={(e) => set("description", e.target.value)}
        rows={5}
      />
      {error && (
        <p role="alert" className="mt-4 text-sm font-semibold text-warm-ink">
          {error}
        </p>
      )}
      {saved && (
        <p role="status" className="text-sm text-warm-ink">
          {STR.profil.saved}
        </p>
      )}
      <Button type="submit" variant="primary" disabled={pending}>
        {pending ? STR.profil.savePending : STR.profil.save}
      </Button>
    </form>
  );
}
