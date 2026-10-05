"use client";

import { useRef, useState } from "react";
import { STR } from "@/lib/strings";
import { AnimalPhoto } from "./animal-photo";

// Mêmes largeurs que l'ancienne photo unique de la fiche (colonne gauche
// 3/5 à partir de lg, pleine largeur avant).
const SIZES =
  "(min-width: 1152px) 640px, (min-width: 1024px) 60vw, (min-width: 768px) 720px, 100vw";

/**
 * Les photos de la fiche, dans le cadre 4:3 d'avant (le squelette de
 * loading.tsx n'a pas bougé). Chaque photo est montrée ENTIÈRE
 * (object-contain) sur l'aplat crème : un portrait garde la tête et les
 * pattes, avec des bandes de fond sur les côtés — c'est aussi ce qui rend
 * invisible le grand côté plafonné à 1600 px (lib/compress-image.ts).
 *
 * Défilement natif avec accroche (scroll-snap) : le swipe du téléphone,
 * sans bibliothèque. Les boutons précédent / suivant, sous le cadre — rien
 * d'autre que « Adoptat » ne recouvre une photo — et toujours visibles :
 * aucune fonction ne dépend du survol.
 *
 * Seule la première photo part avec la page (préchargée, c'est l'image
 * LCP). Les suivantes ne sont montées qu'au premier geste — doigt posé,
 * défilement, bouton — et toujours une d'avance : une fiche ouverte depuis
 * Facebook puis refermée ne télécharge qu'une photo, et ne coûte qu'une
 * transformation d'image.
 */
export function PhotoCarousel({
  photos,
  name,
}: {
  photos: { url: string }[];
  name: string;
}) {
  const trackRef = useRef<HTMLUListElement>(null);
  const [index, setIndex] = useState(0);
  // Dernière photo montée : 0 au départ, puis une d'avance sur celle qu'on
  // regarde dès le premier geste.
  const [loadedUpTo, setLoadedUpTo] = useState(0);
  const count = photos.length;

  function loadAround(i: number) {
    setLoadedUpTo((prev) => Math.max(prev, Math.min(count - 1, i + 1)));
  }

  function onScroll() {
    const track = trackRef.current;
    if (!track || track.clientWidth === 0) return;
    const current = Math.round(track.scrollLeft / track.clientWidth);
    setIndex(current);
    loadAround(current);
  }

  function goTo(i: number) {
    const track = trackRef.current;
    if (!track) return;
    loadAround(i);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    track.scrollTo({
      left: i * track.clientWidth,
      behavior: reduced ? "auto" : "smooth",
    });
  }

  return (
    <div
      role={count > 1 ? "region" : undefined}
      aria-roledescription={count > 1 ? "carusel" : undefined}
      aria-label={count > 1 ? STR.animal.photosLabel(name) : undefined}
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-md border border-warm-border bg-cream-ground">
        <ul
          ref={trackRef}
          onScroll={count > 1 ? onScroll : undefined}
          onPointerDown={count > 1 ? () => loadAround(index) : undefined}
          className="flex h-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {photos.map((photo, i) => (
            <li
              key={photo.url}
              className="relative h-full w-full shrink-0 snap-center"
              role={count > 1 ? "group" : undefined}
              aria-roledescription={count > 1 ? "fotografie" : undefined}
              aria-label={count > 1 ? STR.animal.photoPosition(i + 1, count) : undefined}
            >
              {i <= loadedUpTo && (
                <AnimalPhoto
                  src={photo.url}
                  name={name}
                  alt={
                    count > 1
                      ? `${STR.animal.photoAlt(name)} (${STR.animal.photoCounter(i + 1, count)})`
                      : undefined
                  }
                  sizes={SIZES}
                  fit="contain"
                  preload={i === 0}
                />
              )}
            </li>
          ))}
        </ul>
      </div>
      {count > 1 && (
        <div className="mt-2 flex items-center justify-between">
          <CarouselButton
            label={STR.animal.previousPhoto}
            disabled={index === 0}
            onClick={() => goTo(index - 1)}
            direction="previous"
          />
          <p className="text-sm text-warm-gray" aria-live="polite">
            {STR.animal.photoCounter(index + 1, count)}
          </p>
          <CarouselButton
            label={STR.animal.nextPhoto}
            disabled={index === count - 1}
            onClick={() => goTo(index + 1)}
            direction="next"
          />
        </div>
      )}
    </div>
  );
}

function CarouselButton({
  label,
  disabled,
  onClick,
  direction,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  direction: "previous" | "next";
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="inline-flex size-11 items-center justify-center rounded-md text-warm-ink hover:bg-warm-ink/5 active:bg-warm-ink/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-warm-ink disabled:opacity-30"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
        className="size-6"
      >
        <path d={direction === "previous" ? "m15 18-6-6 6-6" : "m9 18 6-6-6-6"} />
      </svg>
    </button>
  );
}
