"use client";

import {
  startTransition,
  useActionState,
  useEffect,
  useRef,
  useState,
} from "react";
import { upload } from "@vercel/blob/client";
import {
  AGE_GROUP_OPTIONS,
  SEX_OPTIONS,
  SIZE_OPTIONS,
  STATUS_OPTIONS,
  TYPE_OPTIONS,
} from "@/lib/animal-labels";
import { COUNTIES } from "@/lib/counties";
import { animalPhotoPathname } from "@/lib/animal-photo";
import { compressPhoto, type CompressedPhoto } from "@/lib/compress-image";
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

// Le fichier sélectionné est trop lourd pour être même décodé sereinement
// au-delà de cette limite (photos RAW, vidéos renommées…).
const MAX_SOURCE_SIZE = 25 * 1024 * 1024;

function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} Mo`;
  }
  return `${Math.max(1, Math.round(bytes / 1024))} Ko`;
}

function uploadErrorMessage(error: unknown): string {
  // fetch échoue en TypeError quand le réseau est coupé.
  if (error instanceof TypeError) {
    return "L’envoi de la photo a échoué : problème de réseau. Vérifiez votre connexion et réessayez.";
  }
  const message = error instanceof Error ? error.message : String(error);
  return `L’envoi de la photo a échoué : ${message}`;
}

// Formulaire partagé création/édition. Seuls name, type et county sont
// obligatoires — tout le reste peut rester vide pour une saisie rapide
// au téléphone.
export function AnimalForm({
  action,
  initial,
  animalId,
  userId,
  initialPhotoUrl,
  submitLabel,
}: {
  action: (
    state: AnimalFormState,
    formData: FormData,
  ) => Promise<AnimalFormState>;
  initial?: AnimalFormValues;
  animalId?: string;
  userId: string;
  initialPhotoUrl?: string;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, null);

  const photoInputRef = useRef<HTMLInputElement>(null);
  const [photo, setPhoto] = useState<CompressedPhoto | null>(null);
  const [originalSize, setOriginalSize] = useState<number | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [preparing, setPreparing] = useState(false);
  // URL déjà envoyée au store : évite un second upload si la server action
  // renvoie une erreur de validation et que l'utilisateur resoumet.
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  async function handlePhotoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setPhoto(null);
    setOriginalSize(null);
    setPreviewUrl(null);
    setUploadedUrl(null);
    setProgress(null);
    setPhotoError(null);
    if (!file) {
      return;
    }

    // file.type est parfois vide (HEIC sur certains systèmes) : dans ce cas
    // on laisse le décodage trancher plutôt que de refuser d'office.
    if (file.type && !file.type.startsWith("image/")) {
      setPhotoError("Ce fichier n’est pas une image. Choisissez une photo.");
      if (photoInputRef.current) photoInputRef.current.value = "";
      return;
    }
    if (file.size > MAX_SOURCE_SIZE) {
      setPhotoError(
        `Fichier trop lourd (${formatSize(file.size)}, maximum 25 Mo). Choisissez une autre photo.`,
      );
      if (photoInputRef.current) photoInputRef.current.value = "";
      return;
    }

    setPreparing(true);
    try {
      const compressed = await compressPhoto(file);
      setPhoto(compressed);
      setOriginalSize(file.size);
      setPreviewUrl(URL.createObjectURL(compressed.blob));
    } catch (error) {
      setPhotoError(
        error instanceof Error
          ? error.message
          : "La préparation de la photo a échoué.",
      );
      if (photoInputRef.current) photoInputRef.current.value = "";
    } finally {
      setPreparing(false);
    }
  }

  // Avec une photo en attente, on intercepte la soumission : upload direct
  // du navigateur vers Vercel Blob (progression affichée), puis dispatch de
  // la server action avec l'URL obtenue dans photoUrl.
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    if (!photo && !uploadedUrl) {
      return;
    }
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    void submitWithPhoto(formData);
  }

  async function submitWithPhoto(formData: FormData) {
    setPhotoError(null);
    try {
      let url = uploadedUrl;
      if (!url && photo) {
        setProgress(0);
        const result = await upload(
          animalPhotoPathname(userId, photo.extension),
          photo.blob,
          {
            access: "public",
            handleUploadUrl: "/api/photo/upload",
            contentType: photo.blob.type,
            clientPayload: JSON.stringify({ animalId: animalId ?? null }),
            onUploadProgress: ({ percentage }) => setProgress(percentage),
          },
        );
        url = result.url;
        setUploadedUrl(url);
      }
      if (!url) {
        return;
      }
      formData.set("photoUrl", url);
      startTransition(() => {
        formAction(formData);
      });
    } catch (error) {
      setPhotoError(uploadErrorMessage(error));
    } finally {
      setProgress(null);
    }
  }

  const busy = pending || preparing || progress !== null;

  return (
    <form action={formAction} onSubmit={handleSubmit}>
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
      <p>
        <label htmlFor="photo">Photo</label>
        <br />
        {/* Pas d'attribut name : le fichier ne doit jamais partir dans la
            server action (limite de 1 Mo par défaut, 4,5 Mo sur Vercel) —
            il est envoyé au store par upload() après compression. */}
        <input
          id="photo"
          type="file"
          accept="image/*"
          ref={photoInputRef}
          onChange={handlePhotoChange}
          disabled={busy}
        />
      </p>
      {preparing && <p role="status">Préparation de la photo…</p>}
      {photo && previewUrl && (
        <p>
          {/* Aperçu local d'un blob : next/image ne s'applique pas ici. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewUrl} alt="Aperçu de la photo sélectionnée" width={240} />
          <br />
          {/* Le format affiché dit si la bascule Safari (pas d'encodage WebP)
              s'est déclenchée : WebP = voie normale, JPEG = bascule. */}
          Photo prête ({photo.extension === "webp" ? "WebP" : "JPEG"}
          {originalSize !== null && photo.blob.size < originalSize
            ? `, ${formatSize(originalSize)} → ${formatSize(photo.blob.size)}`
            : `, ${formatSize(photo.blob.size)}`}
          ). Elle sera envoyée à l’enregistrement.
        </p>
      )}
      {!photo && !preparing && initialPhotoUrl && (
        <p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={initialPhotoUrl} alt="Photo actuelle" width={240} />
          <br />
          Photo actuelle. Choisir un fichier la remplacera.
        </p>
      )}
      {progress !== null && (
        <p role="status">Envoi de la photo… {Math.round(progress)} %</p>
      )}
      {photoError && <p role="alert">{photoError}</p>}
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
        <button type="submit" disabled={busy}>
          {progress !== null
            ? "Envoi de la photo…"
            : preparing
              ? "Préparation de la photo…"
              : pending
                ? "Enregistrement…"
                : submitLabel}
        </button>
      </p>
    </form>
  );
}
