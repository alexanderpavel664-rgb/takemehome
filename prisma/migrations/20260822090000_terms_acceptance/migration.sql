-- Acceptation des conditions d'utilisation : date et version acceptée.
-- Nullable sans valeur par défaut : les comptes existants n'ont rien
-- accepté, et une date inventée ne prouverait rien — l'espace compte les
-- renvoie vers /accepta-termenii tant que la colonne est NULL.

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "termsAcceptedAt" TIMESTAMP(3),
ADD COLUMN     "termsVersion" TEXT;
