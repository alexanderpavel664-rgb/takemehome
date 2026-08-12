"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

/**
 * Aplat crème + nom en Display 600 — photo absente ou en échec. L'échec
 * réseau ne se présente jamais comme une erreur : même rendu que « pas de
 * photo », jamais d'image de remplacement.
 */
export function PhotoFallback({ name }: { name: string }) {
  return (
    <span className="flex h-full w-full items-center justify-center bg-cream-ground px-2 text-center text-[32px]/[1.05] font-semibold break-words text-warm-ink">
      {name}
    </span>
  );
}

/**
 * Photo d'animal en recadrage centré (fill + object-cover ; le parent doit
 * être `relative` avec un ratio fixe). Client uniquement pour onError :
 * une photo qui ne charge pas retombe sur l'aplat crème.
 */
export function AnimalPhoto({
  src,
  name,
  sizes,
  eager = false,
  preload = false,
}: {
  src: string;
  name: string;
  sizes: string;
  /** Premières cartes de la grille : chargement immédiat. */
  eager?: boolean;
  /** Photo principale de la fiche : image LCP, préchargée. */
  preload?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const ref = useRef<HTMLImageElement>(null);

  // Si l'image a échoué avant l'hydratation, l'événement error est déjà
  // passé : on le rattrape à la pose du composant.
  useEffect(() => {
    const img = ref.current;
    if (img && img.complete && img.naturalWidth === 0) {
      setFailed(true);
    }
  }, []);

  if (failed) {
    return <PhotoFallback name={name} />;
  }
  // `preload` ne doit pas être combiné avec loading/fetchPriority.
  const priorityProps = preload
    ? ({ preload: true } as const)
    : eager
      ? ({ loading: "eager", fetchPriority: "high" } as const)
      : {};
  return (
    <Image
      ref={ref}
      src={src}
      alt={`Photo de ${name}`}
      fill
      sizes={sizes}
      className="object-cover"
      onError={() => setFailed(true)}
      {...priorityProps}
    />
  );
}
