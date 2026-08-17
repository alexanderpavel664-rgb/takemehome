"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { COUNTIES } from "@/lib/counties";
import { STR } from "@/lib/strings";
import { Button } from "@/components/ui/button";
import { Checkbox, Input, Select, Textarea } from "@/components/ui/field";

type ProfileValues = {
  name: string;
  phone: string;
  publicEmail: string;
  county: string;
  city: string;
  description: string;
  /** Consentement à l'affichage public du téléphone et de l'email public. */
  contactConsent: boolean;
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

  function set<K extends keyof ProfileValues>(key: K, value: ProfileValues[K]) {
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
      contactConsent: values.contactConsent,
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

      {/* Le consentement se pose SOUS les champs qu'il concerne : on lit
          d'abord ce qui sera montré, on décide ensuite. Séparé par une
          hairline — ce n'est pas un champ de plus, c'est une décision.

          `checked` vient de la base et vaut false par défaut (colonne
          contactConsent, DEFAULT false) : la case n'est jamais pré-cochée.
          Ne pas la remplacer par un defaultChecked à true « pour aider » —
          ce serait exactement ce que Planet49 et Orange România sanctionnent. */}
      <div className="border-t border-warm-border pt-4">
        <Checkbox
          name="contactConsent"
          label={STR.profil.contactConsentLabel}
          checked={values.contactConsent}
          onChange={(e) => set("contactConsent", e.target.checked)}
          description={
            <>
              {STR.profil.contactConsentDescription}{" "}
              <Link
                href="/confidentialitate"
                className="underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-warm-ink"
              >
                {STR.profil.contactConsentPrivacyLink}
              </Link>
            </>
          }
        />
      </div>

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
