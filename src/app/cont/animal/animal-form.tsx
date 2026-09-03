"use client";

import {
  startTransition,
  useActionState,
  useEffect,
  useRef,
  useState,
} from "react";
import { put } from "@vercel/blob/client";
import {
  AGE_GROUP_OPTIONS,
  SEX_OPTIONS,
  SIZE_OPTIONS,
  STATUS_OPTIONS,
  TYPE_OPTIONS,
} from "@/lib/animal-labels";
import { COUNTIES } from "@/lib/counties";
import { STR } from "@/lib/strings";
import { animalPhotoPathname } from "@/lib/animal-photo";
import { compressPhoto, type CompressedPhoto } from "@/lib/compress-image";
import { reportClientError } from "@/lib/client-report";
import { requestUploadToken, UploadRefusedError } from "@/lib/upload-token";
import { Button, ButtonLink, buttonClasses } from "@/components/ui/button";
import { ChipCheckbox } from "@/components/ui/chip";
import { Checkbox, Input, Select, Textarea } from "@/components/ui/field";
import type { AnimalFormState } from "./actions";

export type AnimalFormValues = {
  name: string;
  /** « Nu are nume » : NULL en base, le champ nom désactivé. */
  noName: boolean;
  type: string;
  /** Combien d'animaux dans l'annonce (fratrie) — 1 par défaut. */
  count: number;
  mustStayTogether: boolean;
  /** « AAAA-LL-JJ » ou vide — la valeur d'un <input type="date">. */
  availableUntil: string;
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
  // Unités roumaines : MB/KB (jamais Mo/Ko), virgule décimale.
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;
  }
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function uploadErrorMessage(error: unknown): string {
  // Jeton refusé par /api/photo/upload : la route a écrit pourquoi, en
  // roumain (limite de débit, session expirée, compte suspendu — chacune
  // avec la conduite à tenir). Sans phrase lisible (page HTML de la
  // plateforme), la formule générique.
  if (error instanceof UploadRefusedError) {
    return error.serverMessage ?? STR.animalForm.uploadFailed;
  }
  // fetch échoue en TypeError quand le réseau est coupé.
  if (error instanceof TypeError) {
    return STR.animalForm.uploadNetworkError;
  }
  // Le message d'origine n'est jamais affiché : il vient du client blob ou
  // du réseau, en anglais, et ne dit rien d'actionnable. Il part dans le
  // rapport d'erreur, pas à l'écran.
  return STR.animalForm.uploadFailed;
}

// Les seuls messages que compressPhoto a le droit de faire remonter à
// l'écran. Une exception inattendue (DOMException, SecurityError…) sortirait
// en anglais avec du détail technique.
const COMPRESS_MESSAGES: readonly string[] = Object.values(STR.compress);

// Le groupe qui entoure un input fichier en sr-only et son label-bouton :
// le focus clavier de l'input se dessine sur le groupe (has-[:focus-visible]
// — jamais après un clic souris), et l'état disabled de l'input éteint le
// bouton. `relative` : l'input absolu reste près du groupe, sans faire
// sauter le défilement quand il prend le focus.
const PHOTO_GROUP =
  "relative rounded-md " +
  "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-warm-ink " +
  "has-[:disabled]:pointer-events-none has-[:disabled]:opacity-50";

// Formulaire partagé création/édition. Seuls name, type et county sont
// obligatoires — tout le reste, photo comprise, peut rester vide pour une
// saisie rapide au téléphone : une fiche sans photo vaut mieux qu'une fiche
// jamais créée. /cont invite ensuite à en ajouter une.
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

  // Deux entrées pour un seul fichier : l'appareil photo (capture) et la
  // galerie. Toutes deux sont vidées ensemble après un refus.
  const cameraInputRef = useRef<HTMLInputElement>(null);
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

  // « Nu are nume » désactive le champ nom (un champ désactivé ne part pas
  // dans le FormData : l'action lit la case, pas un nom vide).
  const [noName, setNoName] = useState(initial?.noName ?? false);
  // Le nombre commande deux choses : « Se adoptă împreună » n'apparaît
  // qu'à partir de 2, et « Mixt » n'est proposé qu'à partir de 2 — s'il
  // était choisi et que le nombre redescend à 1, le sexe se vide.
  const [count, setCount] = useState(initial?.count ?? 1);
  const [sex, setSex] = useState(initial?.sex ?? "");
  const group = count > 1;

  function handleCountChange(event: React.ChangeEvent<HTMLInputElement>) {
    const parsed = Number.parseInt(event.target.value, 10);
    const next = Number.isFinite(parsed) ? parsed : 1;
    setCount(next);
    if (next <= 1 && sex === "MIXED") {
      setSex("");
    }
  }

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function resetPhotoInputs() {
    if (cameraInputRef.current) cameraInputRef.current.value = "";
    if (photoInputRef.current) photoInputRef.current.value = "";
  }

  async function handlePhotoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    // L'autre entrée est vidée : un seul fichier à la fois, celui qu'on
    // vient de choisir, quelle que soit la porte.
    if (event.target !== cameraInputRef.current && cameraInputRef.current) {
      cameraInputRef.current.value = "";
    }
    if (event.target !== photoInputRef.current && photoInputRef.current) {
      photoInputRef.current.value = "";
    }
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
      setPhotoError(STR.animalForm.notAnImage);
      resetPhotoInputs();
      return;
    }
    if (file.size > MAX_SOURCE_SIZE) {
      setPhotoError(STR.animalForm.fileTooLarge(formatSize(file.size)));
      resetPhotoInputs();
      return;
    }

    setPreparing(true);
    try {
      const compressed = await compressPhoto(file);
      setPhoto(compressed);
      setOriginalSize(file.size);
      setPreviewUrl(URL.createObjectURL(compressed.blob));
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      const known = COMPRESS_MESSAGES.includes(message);
      // Un format refusé n'a rien d'anormal ; une exception qu'on n'a pas
      // prévue, si — et elle est souvent propre à un appareil, donc
      // impossible à reproduire sans qu'elle remonte.
      if (!known) {
        reportClientError("photo_prepare_failed", error);
      }
      setPhotoError(known ? message : STR.animalForm.preparingFailed);
      resetPhotoInputs();
    } finally {
      setPreparing(false);
    }
  }

  // La soumission est TOUJOURS interceptée, photo ou pas. Soumis par son
  // attribut action, un formulaire React 19 est réinitialisé (form.reset())
  // dès que l'action se termine — y compris quand elle rend une erreur :
  // « limite atteinte » ou « panne » s'afficheraient au-dessus de champs
  // vidés, et le sauveteur retaperait tout. Dispatchée à la main dans une
  // transition, la même action laisse le DOM tel quel. L'attribut action
  // reste pour la soumission avant hydratation (sans JavaScript) ; la
  // validation native (required) s'exécute avant l'événement submit.
  //
  // Avec une photo en attente : upload direct du navigateur vers Vercel
  // Blob (progression affichée), puis dispatch avec l'URL dans photoUrl.
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    if (photo || uploadedUrl) {
      void submitWithPhoto(formData);
      return;
    }
    startTransition(() => {
      formAction(formData);
    });
  }

  async function submitWithPhoto(formData: FormData) {
    setPhotoError(null);
    try {
      let url = uploadedUrl;
      if (!url && photo) {
        setProgress(0);
        const pathname = animalPhotoPathname(userId, photo.extension);
        // Deux requêtes, séparées pour lire le refus éventuel de la
        // première (voir lib/upload-token.ts) : le jeton, puis le PUT.
        const token = await requestUploadToken({
          pathname,
          clientPayload: JSON.stringify({ animalId: animalId ?? null }),
        });
        const result = await put(pathname, photo.blob, {
          access: "public",
          token,
          contentType: photo.blob.type,
          onUploadProgress: ({ percentage }) => setProgress(percentage),
        });
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
      // L'upload part du navigateur droit vers Vercel Blob : sans cette
      // balise, l'échec ne laisse aucune trace côté serveur. C'est le moment
      // où un sauveteur referme l'onglet. Le statut d'un refus de jeton
      // distingue une limite atteinte (429 — la protection qui bloque
      // quelqu'un de légitime, à surveiller) d'une panne.
      reportClientError("photo_upload_failed", error, {
        bytes: photo?.blob.size ?? 0,
        format: photo?.extension ?? "aucun",
        editing: animalId ? "oui" : "non",
        status:
          error instanceof UploadRefusedError ? String(error.status) : "none",
      });
      setPhotoError(uploadErrorMessage(error));
    } finally {
      setProgress(null);
    }
  }

  const busy = pending || preparing || progress !== null;

  // Erreur photo : côté client (sélection, compression, upload) ou côté
  // serveur (validation) — un seul message affiché, relié au champ #photo.
  const photoErrorMessage = photoError ?? state?.fieldErrors?.photo ?? null;

  // Sous les boutons photo, tant qu'aucune n'est choisie ni déjà en ligne :
  // la consigne de cadrage — une information, pas une exigence.
  const showPhotoHint = !photo && !preparing && !initialPhotoUrl;
  // Ne référence que ce qui est rendu : un id absent ne décrit rien.
  const photoDescribedBy = photoErrorMessage
    ? "photo-error"
    : showPhotoHint
      ? "photo-hint"
      : undefined;

  return (
    <form action={formAction} onSubmit={handleSubmit} className="space-y-4">
      {animalId && <input type="hidden" name="id" value={animalId} />}
      {/* La photo D'ABORD : le sauveteur a l'animal devant lui, et la
          préparation (décodage + compression) tourne pendant qu'il remplit
          le reste — à la soumission il ne reste que l'envoi. */}
      <div>
        <p id="photo-label" className="mb-1 text-sm text-warm-ink">
          {STR.animalForm.photo}
        </p>
        {/* Deux entrées, un seul gestionnaire. Aucune n'a d'attribut name :
            le fichier ne doit jamais partir dans la server action (limite
            de 1 Mo par défaut, 4,5 Mo sur Vercel) — il est envoyé au store
            par upload() après compression. Les inputs restent dans le flux
            en sr-only (clavier, lecteurs d'écran) ; les <label> voisins
            portent le rendu bouton. Aucun n'est plein : le seul bouton
            plein de l'écran est « Publică anunțul ». */}
        <div className="flex flex-wrap gap-2">
          {/* L'appareil photo, sur écrans tactiles seulement :
              capture="environment" ouvre directement la caméra arrière,
              sans passer par la galerie. Sur un ordinateur l'attribut est
              ignoré et « Fă o poză » mentirait — le bouton n'y est pas. */}
          <span className={`hidden pointer-coarse:block ${PHOTO_GROUP}`}>
            <input
              id="photo-camera"
              type="file"
              accept="image/*"
              capture="environment"
              ref={cameraInputRef}
              onChange={handlePhotoChange}
              disabled={busy}
              aria-invalid={photoErrorMessage ? true : undefined}
              aria-describedby={photoDescribedBy}
              className="sr-only"
            />
            <label
              htmlFor="photo-camera"
              className={buttonClasses("outline", "cursor-pointer")}
            >
              {STR.animalForm.takePhoto}
            </label>
          </span>
          {/* La galerie (ou le disque) : la seule entrée sur ordinateur,
              donc en outline ; la seconde sur téléphone, donc en ghost.
              Deux labels pour le même input — HTML l'autorise — plutôt
              qu'un libellé qui change de classe. */}
          <span className={PHOTO_GROUP}>
            <input
              id="photo"
              type="file"
              accept="image/*"
              ref={photoInputRef}
              onChange={handlePhotoChange}
              disabled={busy}
              aria-invalid={photoErrorMessage ? true : undefined}
              aria-describedby={photoDescribedBy}
              className="sr-only"
            />
            <span className="pointer-coarse:hidden">
              <label
                htmlFor="photo"
                className={buttonClasses("outline", "cursor-pointer")}
              >
                {STR.animalForm.choosePhoto}
              </label>
            </span>
            <span className="hidden pointer-coarse:block">
              <label
                htmlFor="photo"
                className={buttonClasses("ghost", "cursor-pointer")}
              >
                {STR.animalForm.chooseFromGallery}
              </label>
            </span>
          </span>
        </div>
        {showPhotoHint && (
          <p id="photo-hint" className="mt-2 max-w-[60ch] text-sm text-warm-gray">
            {STR.animalForm.photoHint}
          </p>
        )}
        {preparing && (
          <p role="status" className="mt-2 text-sm text-warm-ink">
            {STR.animalForm.preparing}
          </p>
        )}
        {photo && previewUrl && (
          <div className="mt-2">
            {/* Aperçu local d'un blob : next/image ne s'applique pas ici. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt={STR.animalForm.previewAlt}
              width={240}
              className="rounded-md border border-warm-border"
            />
            <p className="mt-1 text-sm text-warm-gray">
              {/* Le format affiché dit si la bascule Safari (pas d'encodage WebP)
                  s'est déclenchée : WebP = voie normale, JPEG = bascule. */}
              {STR.animalForm.photoReady(
                photo.extension === "webp" ? "WebP" : "JPEG",
                originalSize !== null && photo.blob.size < originalSize
                  ? `, ${formatSize(originalSize)} → ${formatSize(photo.blob.size)}`
                  : `, ${formatSize(photo.blob.size)}`,
              )}
            </p>
          </div>
        )}
        {!photo && !preparing && initialPhotoUrl && (
          <div className="mt-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={initialPhotoUrl}
              alt={STR.animalForm.currentPhotoAlt}
              width={240}
              className="rounded-md border border-warm-border"
            />
            <p className="mt-1 text-sm text-warm-gray">
              {STR.animalForm.currentPhotoHint}
            </p>
          </div>
        )}
        {progress !== null && (
          <p role="status" className="mt-2 text-sm text-warm-ink">
            {STR.animalForm.uploading(Math.round(progress))}
          </p>
        )}
        {photoErrorMessage && (
          <p
            id="photo-error"
            role="alert"
            className="mt-2 text-sm font-semibold text-warm-ink"
          >
            {photoErrorMessage}
          </p>
        )}
      </div>
      <div>
        {/* Le nom, ou son absence : la case juste sous le champ, pour que
            personne n'écrive plus « - » dans un champ qui l'y forçait. Le
            champ garde sa valeur, seulement désactivé : décocher la
            rend. Sans nom, l'annonce affiche « Cățel » ou « Pisică ». */}
        <Input
          label={STR.animalForm.name}
          id="name"
          name="name"
          type="text"
          defaultValue={initial?.name}
          required={!noName}
          disabled={noName}
          error={state?.fieldErrors?.name}
        />
        <Checkbox
          label={STR.animalForm.noName}
          name="noName"
          checked={noName}
          onChange={(e) => setNoName(e.target.checked)}
          className="mt-2"
        />
      </div>
      <Select
        label={STR.animalForm.type}
        id="type"
        name="type"
        defaultValue={initial?.type ?? ""}
        required
        error={state?.fieldErrors?.type}
      >
        <option value="" disabled>
          {STR.animalForm.typePlaceholder}
        </option>
        {TYPE_OPTIONS.map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </Select>
      {/* À partir de md, les champs courts vont deux par deux ; sur mobile
          ils restent empilés. Le nombre et le sexe ensemble : « Mixt »
          dépend du nombre. */}
      <div className="grid gap-4 md:grid-cols-2">
        <Input
          label={STR.animalForm.count}
          id="count"
          name="count"
          type="number"
          inputMode="numeric"
          min={1}
          max={99}
          step={1}
          defaultValue={initial?.count ?? 1}
          onChange={handleCountChange}
          error={state?.fieldErrors?.count}
        />
        <Select
          label={STR.animalForm.sex}
          id="sex"
          name="sex"
          value={sex}
          onChange={(e) => setSex(e.target.value)}
          error={state?.fieldErrors?.sex}
        >
          <option value="">{STR.animalForm.notSpecified}</option>
          {SEX_OPTIONS.filter(([value]) => group || value !== "MIXED").map(
            ([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ),
          )}
        </Select>
      </div>
      {group && (
        // Deux champs, exprès : une portée n'est pas un groupe inséparable.
        // La phrase sous la case porte cette nuance — c'est elle qui évite
        // que tout le monde coche par réflexe. Démontée sous 2 : rien ne
        // part, l'action lit false.
        <Checkbox
          label={STR.animalForm.mustStayTogether}
          name="mustStayTogether"
          defaultChecked={initial?.mustStayTogether}
          description={STR.animalForm.mustStayTogetherHint}
        />
      )}
      <div className="grid gap-4 md:grid-cols-2">
        <Select
          label={STR.animalForm.age}
          id="ageGroup"
          name="ageGroup"
          defaultValue={initial?.ageGroup ?? ""}
        >
          <option value="">{STR.animalForm.notSpecified}</option>
          {AGE_GROUP_OPTIONS.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
        <Input
          label={STR.animalForm.ageText}
          id="ageText"
          name="ageText"
          type="text"
          defaultValue={initial?.ageText}
          placeholder={STR.animalForm.ageTextPlaceholder}
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Select
          label={STR.animalForm.county}
          id="county"
          name="county"
          defaultValue={initial?.county ?? ""}
          required
          error={state?.fieldErrors?.county}
        >
          <option value="" disabled>
            {STR.animalForm.countyPlaceholder}
          </option>
          {COUNTIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </Select>
        <Input
          label={STR.animalForm.city}
          id="city"
          name="city"
          type="text"
          defaultValue={initial?.city}
        />
      </div>
      <Textarea
        label={STR.animalForm.description}
        id="description"
        name="description"
        defaultValue={initial?.description}
        rows={4}
      />
      <fieldset>
        <legend className="mb-2 text-sm text-warm-ink">
          {STR.animalForm.health}
        </legend>
        <div className="flex flex-wrap gap-2">
          <ChipCheckbox
            label={STR.animalForm.sterilized}
            name="sterilized"
            defaultChecked={initial?.sterilized}
          />
          <ChipCheckbox
            label={STR.animalForm.vaccinated}
            name="vaccinated"
            defaultChecked={initial?.vaccinated}
          />
          <ChipCheckbox
            label={STR.animalForm.microchipped}
            name="microchipped"
            defaultChecked={initial?.microchipped}
          />
        </div>
      </fieldset>
      <fieldset>
        <legend className="mb-2 text-sm text-warm-ink">
          {STR.animalForm.goodWith}
        </legend>
        <div className="flex flex-wrap gap-2">
          <ChipCheckbox
            label={STR.animalForm.goodWithKids}
            name="goodWithKids"
            defaultChecked={initial?.goodWithKids}
          />
          <ChipCheckbox
            label={STR.animalForm.goodWithDogs}
            name="goodWithDogs"
            defaultChecked={initial?.goodWithDogs}
          />
          <ChipCheckbox
            label={STR.animalForm.goodWithCats}
            name="goodWithCats"
            defaultChecked={initial?.goodWithCats}
          />
        </div>
      </fieldset>
      {/* Taille rejoint Statut pour former la dernière paire de champs courts. */}
      <div className="grid gap-4 md:grid-cols-2">
        <Select
          label={STR.animalForm.size}
          id="size"
          name="size"
          defaultValue={initial?.size ?? ""}
        >
          <option value="">{STR.animalForm.notSpecifiedFeminine}</option>
          {SIZE_OPTIONS.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
        <Select
          label={STR.animalForm.status}
          id="status"
          name="status"
          defaultValue={initial?.status ?? "AVAILABLE"}
        >
          {STATUS_OPTIONS.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </div>
      <div>
        {/* L'échéance : une date, jamais une case « urgent ». Pas de min :
            une annonce modifiée après sa date doit rester enregistrable,
            et le semn s'efface de lui-même. La phrase dessous dit ce que
            la date fait, et que l'annonce reste après. */}
        <Input
          label={STR.animalForm.availableUntil}
          id="availableUntil"
          name="availableUntil"
          type="date"
          defaultValue={initial?.availableUntil}
          aria-describedby="availableUntil-hint"
          error={state?.fieldErrors?.availableUntil}
        />
        <p
          id="availableUntil-hint"
          className="mt-1 max-w-[60ch] text-sm text-warm-gray"
        >
          {STR.animalForm.availableUntilHint}
        </p>
      </div>
      {state?.formError && (
        <p role="alert" className="text-sm font-semibold text-warm-ink">
          {state.formError}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" variant="primary" disabled={busy}>
          {progress !== null
            ? STR.animalForm.uploadingLabel
            : preparing
              ? STR.animalForm.preparing
              : pending
                ? STR.animalForm.saving
                : submitLabel}
        </Button>
        {/* Chemin de retour sans valider le formulaire. */}
        <ButtonLink variant="ghost" href="/cont">
          {STR.animalForm.cancel}
        </ButtonLink>
      </div>
    </form>
  );
}
