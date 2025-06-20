-- CreateEnum
CREATE TYPE "Genre" AS ENUM ('BRIGHT', 'CALM', 'DARK', 'DRAMATIC', 'FUNKY', 'HAPPY', 'INSPIRATIONAL', 'ROMANTIC', 'SAD');

-- AlterTable
ALTER TABLE "Creation" ADD COLUMN     "genre" "Genre";
