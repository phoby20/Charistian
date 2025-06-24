-- AlterEnum
ALTER TYPE "CreationType" ADD VALUE 'ORIGINAL_SCORE';

-- AlterTable
ALTER TABLE "Creation" ADD COLUMN     "composer" TEXT,
ADD COLUMN     "isForSale" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isOriginal" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lyricist" TEXT,
ADD COLUMN     "lyrics" TEXT,
ADD COLUMN     "lyricsEn" TEXT,
ADD COLUMN     "lyricsJa" TEXT,
ADD COLUMN     "referenceUrls" TEXT[],
ADD COLUMN     "saleEndDate" TIMESTAMP(3),
ADD COLUMN     "saleStartDate" TIMESTAMP(3),
ADD COLUMN     "tempo" INTEGER,
ADD COLUMN     "thumbnailUrl" TEXT,
ADD COLUMN     "titleEn" TEXT,
ADD COLUMN     "titleJa" TEXT,
ALTER COLUMN "description" DROP NOT NULL;

-- CreateTable
CREATE TABLE "ScoreLike" (
    "id" TEXT NOT NULL,
    "creationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScoreLike_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScoreComment" (
    "id" TEXT NOT NULL,
    "creationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScoreComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ScoreLike_creationId_userId_key" ON "ScoreLike"("creationId", "userId");

-- AddForeignKey
ALTER TABLE "ScoreLike" ADD CONSTRAINT "ScoreLike_creationId_fkey" FOREIGN KEY ("creationId") REFERENCES "Creation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScoreLike" ADD CONSTRAINT "ScoreLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScoreComment" ADD CONSTRAINT "ScoreComment_creationId_fkey" FOREIGN KEY ("creationId") REFERENCES "Creation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScoreComment" ADD CONSTRAINT "ScoreComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
