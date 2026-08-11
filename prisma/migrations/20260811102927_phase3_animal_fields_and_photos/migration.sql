/*
  Warnings:

  - You are about to drop the column `photoUrl` on the `Animal` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "AnimalSize" AS ENUM ('SMALL', 'MEDIUM', 'LARGE');

-- CreateEnum
CREATE TYPE "AnimalPurpose" AS ENUM ('ADOPTION', 'FOSTER');

-- AlterTable
ALTER TABLE "Animal" DROP COLUMN "photoUrl",
ADD COLUMN     "goodWithCats" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "goodWithDogs" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "goodWithKids" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "microchipped" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "purpose" "AnimalPurpose" NOT NULL DEFAULT 'ADOPTION',
ADD COLUMN     "size" "AnimalSize",
ADD COLUMN     "sterilized" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "vaccinated" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "sex" DROP NOT NULL,
ALTER COLUMN "ageGroup" DROP NOT NULL,
ALTER COLUMN "ageText" DROP NOT NULL,
ALTER COLUMN "city" DROP NOT NULL,
ALTER COLUMN "description" DROP NOT NULL;

-- CreateTable
CREATE TABLE "AnimalPhoto" (
    "id" TEXT NOT NULL,
    "animalId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnimalPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AnimalPhoto_animalId_idx" ON "AnimalPhoto"("animalId");

-- CreateIndex
CREATE INDEX "Animal_size_idx" ON "Animal"("size");

-- CreateIndex
CREATE INDEX "Animal_purpose_idx" ON "Animal"("purpose");

-- AddForeignKey
ALTER TABLE "AnimalPhoto" ADD CONSTRAINT "AnimalPhoto_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
