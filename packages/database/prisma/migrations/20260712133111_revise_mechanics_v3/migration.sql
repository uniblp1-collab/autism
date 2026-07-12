-- CreateEnum
CREATE TYPE "CardType" AS ENUM ('NOUN', 'ADJECTIVE');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MASCULINE', 'FEMININE', 'NEUTER');

-- AlterTable
ALTER TABLE "cards" ADD COLUMN     "cardType" "CardType" NOT NULL DEFAULT 'NOUN',
ADD COLUMN     "gender" "Gender",
ADD COLUMN     "isSystemCard" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "phraseForm" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "phraseFormFeminine" TEXT,
ADD COLUMN     "phraseFormMasculine" TEXT,
ADD COLUMN     "phraseFormNeuter" TEXT,
ALTER COLUMN "imageUrl" DROP NOT NULL;

-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "isPrimary" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "phraseForm" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "sentenceTemplate" TEXT NOT NULL DEFAULT '{verb} {noun}';

-- AlterTable
ALTER TABLE "children" ADD COLUMN     "difficultyLevel" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "unlockedCategoryIds" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;
