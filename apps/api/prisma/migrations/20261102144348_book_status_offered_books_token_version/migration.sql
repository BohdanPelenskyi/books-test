-- CreateEnum
CREATE TYPE "BookStatus" AS ENUM ('AVAILABLE', 'EXCHANGED');

-- AlterTable
ALTER TABLE "Book" ADD COLUMN     "status" "BookStatus" NOT NULL DEFAULT 'AVAILABLE';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "tokenVersion" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "_OfferedBooks" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_OfferedBooks_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_OfferedBooks_B_index" ON "_OfferedBooks"("B");

-- CreateIndex
CREATE INDEX "Book_status_idx" ON "Book"("status");

-- AddForeignKey
ALTER TABLE "_OfferedBooks" ADD CONSTRAINT "_OfferedBooks_A_fkey" FOREIGN KEY ("A") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_OfferedBooks" ADD CONSTRAINT "_OfferedBooks_B_fkey" FOREIGN KEY ("B") REFERENCES "ExchangeRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
