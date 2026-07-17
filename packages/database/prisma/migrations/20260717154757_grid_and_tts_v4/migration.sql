/*
  Warnings:

  - You are about to drop the column `height` on the `cards` table. All the data in the column will be lost.
  - You are about to drop the column `width` on the `cards` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "cards" DROP COLUMN "height",
DROP COLUMN "width",
ADD COLUMN     "ttsPhrase" TEXT NOT NULL DEFAULT '';

-- Бэкфилл: у уже существующих карточек фраза озвучивания берётся из ttsText (безопасный
-- дефолт — то, что и так произносилось у Да/Нет; у существительных это подпись). Библиотечные
-- карточки получают осмысленные фразы из seed при повторном сиде (редакция 4).
UPDATE "cards" SET "ttsPhrase" = "ttsText" WHERE "ttsPhrase" = '';

-- AlterTable
ALTER TABLE "children" ADD COLUMN     "cardsPerPage" INTEGER NOT NULL DEFAULT 6;
