/*
  Warnings:

  - You are about to drop the `TrackedSymbol` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "TrackedSymbol";

-- CreateTable
CREATE TABLE "tracked_symbol" (
    "id" UUID NOT NULL,
    "symbol" VARCHAR NOT NULL,
    "name" VARCHAR,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "tracked_symbol_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tracked_symbol_symbol_key" ON "tracked_symbol"("symbol");
