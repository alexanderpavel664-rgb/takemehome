-- V3, la demande (octobre 2026). Trois changements additifs, sans
-- réécriture de table ni d'annonce existante. Le code déployé avant cette
-- migration continue de fonctionner : il ne lit pas les nouvelles colonnes
-- et n'écrit jamais qu'une photo, en position 0, après avoir supprimé les
-- précédentes — l'index unique ne le gêne pas.
--
-- 1. Animal.dewormed (« Deparazitat ») : false = non renseigné, comme
--    sterilized, vaccinated et microchipped.
-- 2. AnimalPhoto.width / height : dimensions du fichier, pour
--    og:image:width/height. NULL pour les photos existantes jusqu'au
--    passage de scripts/dimensions-photos.mts.
-- 3. (animalId, position) devient unique : une seule photo principale par
--    annonce. Vérifié avant migration sur les deux branches : au plus une
--    photo par annonce, toutes en position 0, aucun doublon. L'index unique
--    est créé AVANT la suppression de l'ancien : si un doublon était apparu
--    entre-temps, la migration échouerait sans avoir rien retiré.

-- AlterTable
ALTER TABLE "Animal" ADD COLUMN     "dewormed" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "AnimalPhoto" ADD COLUMN     "height" INTEGER,
ADD COLUMN     "width" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "AnimalPhoto_animalId_position_key" ON "AnimalPhoto"("animalId", "position");

-- DropIndex
DROP INDEX "AnimalPhoto_animalId_position_idx";
