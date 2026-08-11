import Link from "next/link";
import type { AgeGroup, AnimalType, Sex } from "@/generated/prisma/client";
import { animalMetaLine } from "@/lib/animal-display";
import { countyName } from "@/lib/counties";
import { AnimalPhoto, PhotoPlaceholder } from "./animal-image";

// Largeurs réelles d'une carte : grille 2 colonnes sur mobile, 3 puis 4
// colonnes dans un conteneur max-w-5xl (1024px) sur desktop.
const CARD_SIZES = "(min-width: 1024px) 246px, (min-width: 640px) 33vw, 50vw";

type CardAnimal = {
  id: string;
  name: string;
  type: AnimalType;
  sex: Sex | null;
  ageGroup: AgeGroup | null;
  ageText: string | null;
  county: string;
  photos: { url: string }[];
};

/** Carte de la grille publique : photo, nom, « type · sexe · âge », județ. */
export function AnimalCard({
  animal,
  eager = false,
}: {
  animal: CardAnimal;
  eager?: boolean;
}) {
  const photo = animal.photos[0];
  return (
    <Link href={`/animal/${animal.id}`} className="block border">
      <span className="relative block aspect-[4/3] overflow-hidden">
        {photo ? (
          <AnimalPhoto
            src={photo.url}
            name={animal.name}
            sizes={CARD_SIZES}
            eager={eager}
          />
        ) : (
          <PhotoPlaceholder name={animal.name} />
        )}
      </span>
      <span className="block p-2">
        <span className="block font-bold">{animal.name}</span>
        <span className="block text-sm">{animalMetaLine(animal)}</span>
        <span className="block text-sm text-gray-600">
          {countyName(animal.county)}
        </span>
      </span>
    </Link>
  );
}
