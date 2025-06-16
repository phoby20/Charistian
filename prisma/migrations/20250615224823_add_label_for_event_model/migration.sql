-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "label" TEXT;

-- CreateTable
CREATE TABLE "UserEventLabel" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserEventLabel_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserEventLabel_userId_label_key" ON "UserEventLabel"("userId", "label");

-- AddForeignKey
ALTER TABLE "UserEventLabel" ADD CONSTRAINT "UserEventLabel_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
