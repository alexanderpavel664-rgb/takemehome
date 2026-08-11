import type {
  AgeGroup,
  AnimalSize,
  AnimalStatus,
  AnimalType,
  Sex,
} from "@/generated/prisma/client";

export const TYPE_LABELS: Record<AnimalType, string> = {
  DOG: "Chien",
  CAT: "Chat",
  OTHER: "Autre",
};

export const SEX_LABELS: Record<Sex, string> = {
  MALE: "Mâle",
  FEMALE: "Femelle",
};

export const AGE_GROUP_LABELS: Record<AgeGroup, string> = {
  BABY: "Bébé",
  YOUNG: "Jeune",
  ADULT: "Adulte",
  SENIOR: "Senior",
};

export const SIZE_LABELS: Record<AnimalSize, string> = {
  SMALL: "Petit",
  MEDIUM: "Moyen",
  LARGE: "Grand",
};

export const STATUS_LABELS: Record<AnimalStatus, string> = {
  AVAILABLE: "Disponible",
  ADOPTED: "Adopté",
};

export const TYPE_OPTIONS = Object.entries(TYPE_LABELS) as [
  AnimalType,
  string,
][];
export const SEX_OPTIONS = Object.entries(SEX_LABELS) as [Sex, string][];
export const AGE_GROUP_OPTIONS = Object.entries(AGE_GROUP_LABELS) as [
  AgeGroup,
  string,
][];
export const SIZE_OPTIONS = Object.entries(SIZE_LABELS) as [
  AnimalSize,
  string,
][];
export const STATUS_OPTIONS = Object.entries(STATUS_LABELS) as [
  AnimalStatus,
  string,
][];
