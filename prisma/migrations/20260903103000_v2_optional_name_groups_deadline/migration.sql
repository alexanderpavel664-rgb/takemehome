-- V2, premiers jours d'usage réel (septembre 2026). Trois changements sur
-- Animal, tous additifs et sans réécriture de table : les annonces
-- existantes gardent leur nom, valent count = 1, mustStayTogether = false
-- et sans échéance. Le code déployé avant cette migration continue de
-- fonctionner (il écrit toujours un nom, ne lit pas les nouvelles colonnes).
--
-- 1. Sexe « Mixt » pour les fratries mélangées (count > 1 seulement, la
--    règle vit dans l'action du formulaire). PostgreSQL ≥ 12 accepte
--    ADD VALUE dans une transaction tant que la valeur n'y est pas utilisée.
-- 2. name nullable : NULL = pas de nom, l'affichage met « Cățel » /
--    « Pisică ». Les fiches existantes écrites « - » ou « Nu are » sont
--    corrigées à part (scripts/nume-lipsa.mts), jamais par la migration.
-- 3. count / mustStayTogether / availableUntil : voir les commentaires du
--    schéma. availableUntil est une DATE sans heure : une échéance est un
--    jour, pas un instant.

-- AlterEnum
ALTER TYPE "Sex" ADD VALUE 'MIXED';

-- AlterTable
ALTER TABLE "Animal" ADD COLUMN     "availableUntil" DATE,
ADD COLUMN     "count" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "mustStayTogether" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "name" DROP NOT NULL;
