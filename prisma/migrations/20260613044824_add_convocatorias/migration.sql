-- CreateTable
CREATE TABLE "convocatorias" (
    "id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "opens_at" TIMESTAMPTZ(6) NOT NULL,
    "closes_at" TIMESTAMPTZ(6) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "convocatorias_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "convocatorias_opens_at_closes_at_idx" ON "convocatorias"("opens_at", "closes_at");
