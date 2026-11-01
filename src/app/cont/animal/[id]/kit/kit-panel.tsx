"use client";

import { useEffect, useState } from "react";
import type { ChangeEvent } from "react";
import { KIT_FORMATS, type KitFormat } from "@/lib/share-kit";
import { STR } from "@/lib/strings";
import { AnimalPhoto } from "@/components/ui/animal-photo";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { copyToClipboard } from "@/components/ui/copy-button";
import { Textarea } from "@/components/ui/field";

type Prepared = { src: string; file: File; preview: string };

// Safari sur iPhone n'enregistre dans Photos que par le menu de partage : un
// lien de téléchargement finirait dans Fichiers. Ailleurs, le téléchargement
// fait le travail en un geste, et la galerie d'Android le montre.
function savesThroughShareSheet(): boolean {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

export function KitPanel({
  id,
  name,
  fileName,
  photos,
  initialText,
  editHref,
}: {
  id: string;
  name: string;
  fileName: string;
  /** Pour les vignettes : la route d'image ne reçoit que le rang. */
  photos: string[];
  initialText: string;
  editHref: string;
}) {
  const [text, setText] = useState(initialText);
  const [copy, setCopy] = useState<"idle" | "copied" | "failed">("idle");
  const [format, setFormat] = useState<KitFormat>("4x5");
  const [photo, setPhoto] = useState(0);
  const [prepared, setPrepared] = useState<Prepared | null>(null);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const [saveFailed, setSaveFailed] = useState(false);

  const src = photos.length
    ? `/cont/animal/${id}/kit/imagine?format=${format}&foto=${photo}`
    : null;
  const ready = prepared?.src === src ? prepared : null;
  const failed = failedSrc === src && src !== null;

  // L'image est préparée dès qu'elle est choisie, pas au toucher : le partage
  // exige un geste récent, et Safari le perd pendant une attente réseau.
  useEffect(() => {
    if (!src) {
      return;
    }
    const controller = new AbortController();
    let preview: string | null = null;
    fetch(src, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) {
          throw new Error(String(response.status));
        }
        return response.blob();
      })
      .then((blob) => {
        preview = URL.createObjectURL(blob);
        setPrepared({
          src,
          preview,
          file: new File([blob], `${fileName}-${format}.jpg`, {
            type: "image/jpeg",
          }),
        });
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setFailedSrc(src);
        }
      });
    return () => {
      controller.abort();
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [src, fileName, format]);

  async function onCopy() {
    try {
      await copyToClipboard(text);
      setCopy("copied");
    } catch {
      setCopy("failed");
    }
  }

  async function onSave() {
    if (!ready) {
      return;
    }
    setSaveFailed(false);
    const data = { files: [ready.file] };
    if (savesThroughShareSheet() && navigator.canShare?.(data)) {
      try {
        await navigator.share(data);
      } catch (error) {
        // Menu refermé sans choisir : ce n'est pas un échec.
        if ((error as Error).name !== "AbortError") {
          setSaveFailed(true);
        }
      }
      return;
    }
    const link = document.createElement("a");
    link.href = ready.preview;
    link.download = ready.file.name;
    link.click();
  }

  return (
    <div className="mt-4 space-y-4">
      <Card className="p-4">
        <h2 className="text-lg font-semibold text-warm-ink">
          {STR.kit.stepText}
        </h2>
        <Textarea
          label={STR.kit.textLabel}
          name="kitText"
          rows={10}
          value={text}
          onChange={(event: ChangeEvent<HTMLTextAreaElement>) => {
            setText(event.target.value);
            setCopy("idle");
          }}
        />
        <p className="mt-1 text-sm text-warm-gray">{STR.kit.textHint}</p>
        <Button variant="outline" type="button" onClick={onCopy} className="mt-3">
          {copy === "copied"
            ? STR.animal.copied
            : copy === "failed"
              ? STR.animal.copyFailed
              : STR.kit.copy}
        </Button>
      </Card>

      <Card className="p-4">
        <h2 className="text-lg font-semibold text-warm-ink">
          {STR.kit.stepImage}
        </h2>
        {src === null ? (
          <>
            <p className="mt-1 text-base text-warm-ink">{STR.kit.noPhoto}</p>
            <ButtonLink variant="outline" href={editHref} className="mt-3">
              {STR.kit.addPhoto}
            </ButtonLink>
          </>
        ) : (
          <>
            {photos.length > 1 && (
              <fieldset className="mt-2">
                <legend className="text-sm text-warm-ink">
                  {STR.kit.photoLabel}
                </legend>
                <div className="mt-1 flex flex-wrap gap-2">
                  {photos.map((url, i) => (
                    <button
                      key={url}
                      type="button"
                      aria-pressed={photo === i}
                      aria-label={STR.animal.photoPosition(i + 1, photos.length)}
                      onClick={() => setPhoto(i)}
                      className={`relative size-20 overflow-hidden rounded-md border-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-warm-ink ${photo === i ? "border-warm-ink" : "border-transparent"}`}
                    >
                      <AnimalPhoto src={url} name={name} alt="" sizes="80px" />
                    </button>
                  ))}
                </div>
              </fieldset>
            )}
            <fieldset className="mt-3">
              <legend className="text-sm text-warm-ink">
                {STR.kit.formatLabel}
              </legend>
              <div className="mt-1 flex gap-2">
                {KIT_FORMATS.map((value) => (
                  <Button
                    key={value}
                    type="button"
                    variant={format === value ? "outline" : "ghost"}
                    aria-pressed={format === value}
                    onClick={() => setFormat(value)}
                  >
                    {STR.kit.formats[value]}
                  </Button>
                ))}
              </div>
            </fieldset>
            <div
              className={`relative mt-3 w-full max-w-72 overflow-hidden rounded-md border border-warm-border bg-cream-ground ${format === "4x5" ? "aspect-[4/5]" : "aspect-[9/16]"}`}
            >
              {ready && (
                // Un fichier déjà en mémoire, pas une URL distante : next/image
                // n'a rien à optimiser ici.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={ready.preview}
                  alt={STR.kit.previewAlt(name)}
                  className="size-full object-cover"
                />
              )}
            </div>
            <div role="status" className="mt-2 text-sm text-warm-ink">
              {failed && <p>{STR.kit.imageFailed}</p>}
              {saveFailed && <p>{STR.kit.saveFailed}</p>}
            </div>
            <Button
              variant="primary"
              type="button"
              onClick={onSave}
              disabled={!ready}
              className="mt-2"
            >
              {ready || failed ? STR.kit.save : STR.kit.preparing}
            </Button>
          </>
        )}
      </Card>

      <p className="max-w-[66ch] text-base text-warm-ink">{STR.kit.stepPost}</p>
    </div>
  );
}
