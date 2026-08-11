"use client";

import { useActionState } from "react";
import {
  AGE_GROUP_OPTIONS,
  SEX_OPTIONS,
  SIZE_OPTIONS,
  STATUS_OPTIONS,
  TYPE_OPTIONS,
} from "@/lib/animal-labels";
import { COUNTIES } from "@/lib/counties";
import type { AnimalFormState } from "./actions";

export type AnimalFormValues = {
  name: string;
  type: string;
  sex: string;
  ageGroup: string;
  ageText: string;
  size: string;
  county: string;
  city: string;
  description: string;
  sterilized: boolean;
  vaccinated: boolean;
  microchipped: boolean;
  goodWithKids: boolean;
  goodWithDogs: boolean;
  goodWithCats: boolean;
  status: string;
};

// Formulaire partagé création/édition. Seuls name, type et county sont
// obligatoires — tout le reste peut rester vide pour une saisie rapide
// au téléphone.
export function AnimalForm({
  action,
  initial,
  animalId,
  submitLabel,
}: {
  action: (
    state: AnimalFormState,
    formData: FormData,
  ) => Promise<AnimalFormState>;
  initial?: AnimalFormValues;
  animalId?: string;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, null);

  return (
    <form action={formAction}>
      {animalId && <input type="hidden" name="id" value={animalId} />}
      <p>
        <label htmlFor="name">Nom *</label>
        <br />
        <input
          id="name"
          name="name"
          type="text"
          defaultValue={initial?.name}
          required
        />
      </p>
      <p>
        <label htmlFor="type">Type *</label>
        <br />
        <select
          id="type"
          name="type"
          defaultValue={initial?.type ?? ""}
          required
        >
          <option value="" disabled>
            — Choisir —
          </option>
          {TYPE_OPTIONS.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </p>
      <p>
        <label htmlFor="sex">Sexe</label>
        <br />
        <select id="sex" name="sex" defaultValue={initial?.sex ?? ""}>
          <option value="">Non renseigné</option>
          {SEX_OPTIONS.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </p>
      <p>
        <label htmlFor="ageGroup">Âge</label>
        <br />
        <select
          id="ageGroup"
          name="ageGroup"
          defaultValue={initial?.ageGroup ?? ""}
        >
          <option value="">Non renseigné</option>
          {AGE_GROUP_OPTIONS.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </p>
      <p>
        <label htmlFor="ageText">Âge en toutes lettres</label>
        <br />
        <input
          id="ageText"
          name="ageText"
          type="text"
          defaultValue={initial?.ageText}
          placeholder="ex. 2 ans"
        />
      </p>
      <p>
        <label htmlFor="size">Taille</label>
        <br />
        <select id="size" name="size" defaultValue={initial?.size ?? ""}>
          <option value="">Non renseignée</option>
          {SIZE_OPTIONS.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </p>
      <p>
        <label htmlFor="county">Județ *</label>
        <br />
        <select
          id="county"
          name="county"
          defaultValue={initial?.county ?? ""}
          required
        >
          <option value="" disabled>
            — Choisir un județ —
          </option>
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
        <input id="city" name="city" type="text" defaultValue={initial?.city} />
      </p>
      <p>
        <label htmlFor="description">Description</label>
        <br />
        <textarea
          id="description"
          name="description"
          defaultValue={initial?.description}
          rows={4}
        />
      </p>
      <fieldset>
        <legend>Santé</legend>
        <label>
          <input
            type="checkbox"
            name="sterilized"
            defaultChecked={initial?.sterilized}
          />{" "}
          Stérilisé
        </label>{" "}
        <label>
          <input
            type="checkbox"
            name="vaccinated"
            defaultChecked={initial?.vaccinated}
          />{" "}
          Vacciné
        </label>{" "}
        <label>
          <input
            type="checkbox"
            name="microchipped"
            defaultChecked={initial?.microchipped}
          />{" "}
          Pucé
        </label>
      </fieldset>
      <fieldset>
        <legend>S’entend bien avec</legend>
        <label>
          <input
            type="checkbox"
            name="goodWithKids"
            defaultChecked={initial?.goodWithKids}
          />{" "}
          Enfants
        </label>{" "}
        <label>
          <input
            type="checkbox"
            name="goodWithDogs"
            defaultChecked={initial?.goodWithDogs}
          />{" "}
          Chiens
        </label>{" "}
        <label>
          <input
            type="checkbox"
            name="goodWithCats"
            defaultChecked={initial?.goodWithCats}
          />{" "}
          Chats
        </label>
      </fieldset>
      <p>
        <label htmlFor="status">Statut</label>
        <br />
        <select
          id="status"
          name="status"
          defaultValue={initial?.status ?? "AVAILABLE"}
        >
          {STATUS_OPTIONS.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </p>
      {state?.error && <p role="alert">{state.error}</p>}
      <p>
        <button type="submit" disabled={pending}>
          {pending ? "Enregistrement…" : submitLabel}
        </button>
      </p>
    </form>
  );
}
