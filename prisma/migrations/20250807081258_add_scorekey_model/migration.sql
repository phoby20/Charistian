-- CreateTable
CREATE TABLE "ScoreKey" (
    "id" TEXT NOT NULL,
    "creationId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScoreKey_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ScoreKey" ADD CONSTRAINT "ScoreKey_creationId_fkey" FOREIGN KEY ("creationId") REFERENCES "Creation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
