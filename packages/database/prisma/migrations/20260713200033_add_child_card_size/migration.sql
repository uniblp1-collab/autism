-- CreateEnum
CREATE TYPE "CardSize" AS ENUM ('SMALL', 'MEDIUM', 'LARGE');

-- AlterTable
ALTER TABLE "children" ADD COLUMN     "cardSize" "CardSize" NOT NULL DEFAULT 'SMALL';
