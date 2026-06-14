-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('ADMIN', 'EVALUADOR', 'RESPONSABLE_FACULTAD');

-- CreateEnum
CREATE TYPE "applicant_type" AS ENUM ('comunidad_campesina', 'comunidad_urbana', 'gobierno_local', 'otro');

-- CreateEnum
CREATE TYPE "request_channel" AS ENUM ('app_movil', 'web');

-- CreateEnum
CREATE TYPE "request_priority" AS ENUM ('baja', 'media', 'alta');

-- CreateEnum
CREATE TYPE "request_status" AS ENUM ('ENVIADA', 'EN_REVISION', 'INFORMACION_PENDIENTE', 'DERIVADA_A_FACULTAD', 'ACEPTADA_GRUPO_ABIERTO', 'EN_EJECUCION', 'ATENDIDA_CONSTANCIA_EMITIDA', 'CERRADA', 'NO_PROCEDE');

-- CreateEnum
CREATE TYPE "knowledge_source_type" AS ENUM ('insumo_desafio', 'publica', 'simulada', 'referencial');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "full_name" VARCHAR(120) NOT NULL,
    "role" "user_role" NOT NULL,
    "faculty_area_id" UUID,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faculty_areas" (
    "id" UUID NOT NULL,
    "slug" VARCHAR(60) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "description" TEXT NOT NULL,
    "topics" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "support_types" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "contact_email" VARCHAR(150),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "faculty_areas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "services" (
    "id" UUID NOT NULL,
    "slug" VARCHAR(80) NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "category" VARCHAR(80) NOT NULL,
    "description" TEXT NOT NULL,
    "requirements" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "support_types" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "faculty_area_id" UUID NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "communities" (
    "id" UUID NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "type" "applicant_type" NOT NULL,
    "district" VARCHAR(100) NOT NULL,
    "province" VARCHAR(100) NOT NULL DEFAULT 'Huancayo',
    "region" VARCHAR(100) NOT NULL DEFAULT 'Junín',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "communities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support_requests" (
    "id" UUID NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "applicant_type" "applicant_type" NOT NULL,
    "channel" "request_channel" NOT NULL,
    "representative_name" VARCHAR(120) NOT NULL,
    "representative_dni" CHAR(8) NOT NULL,
    "contact_phone" VARCHAR(15) NOT NULL,
    "contact_email" VARCHAR(150),
    "community_id" UUID,
    "community_name" VARCHAR(150) NOT NULL,
    "location" VARCHAR(150) NOT NULL,
    "district" VARCHAR(100) NOT NULL,
    "raw_description" TEXT NOT NULL,
    "formal_title" VARCHAR(200),
    "formal_description" TEXT NOT NULL,
    "category" VARCHAR(80) NOT NULL,
    "support_type" VARCHAR(80) NOT NULL,
    "suggested_area_id" UUID,
    "assigned_area_id" UUID,
    "beneficiaries_count" INTEGER,
    "priority" "request_priority" NOT NULL DEFAULT 'media',
    "status" "request_status" NOT NULL DEFAULT 'ENVIADA',
    "entity_name" VARCHAR(150),
    "official_position" VARCHAR(100),
    "attached_document_name" VARCHAR(200),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "support_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_classifications" (
    "id" UUID NOT NULL,
    "request_id" UUID NOT NULL,
    "category" VARCHAR(80) NOT NULL,
    "support_type" VARCHAR(80) NOT NULL,
    "suggested_area" VARCHAR(120) NOT NULL,
    "suggested_area_id" UUID,
    "confidence" DECIMAL(3,2) NOT NULL,
    "missing_fields" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "reasoning_summary" TEXT NOT NULL,
    "generated_summary" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_classifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "request_status_history" (
    "id" UUID NOT NULL,
    "request_id" UUID NOT NULL,
    "from_status" "request_status",
    "to_status" "request_status" NOT NULL,
    "owner_area" VARCHAR(150) NOT NULL,
    "next_step" VARCHAR(250),
    "comment" TEXT,
    "changed_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "request_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "request_replies" (
    "id" UUID NOT NULL,
    "request_id" UUID NOT NULL,
    "message" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "request_replies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_documents" (
    "id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "source_type" "knowledge_source_type" NOT NULL,
    "content" TEXT NOT NULL,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "knowledge_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_chunks" (
    "id" UUID NOT NULL,
    "document_id" UUID NOT NULL,
    "chunk_index" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "embedding" vector(768) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "knowledge_chunks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "request_templates" (
    "id" UUID NOT NULL,
    "slug" VARCHAR(60) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "applicant_type" "applicant_type",
    "content" TEXT NOT NULL,
    "placeholders" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "request_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "faculty_areas_slug_key" ON "faculty_areas"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "services_slug_key" ON "services"("slug");

-- CreateIndex
CREATE INDEX "services_category_idx" ON "services"("category");

-- CreateIndex
CREATE INDEX "services_faculty_area_id_idx" ON "services"("faculty_area_id");

-- CreateIndex
CREATE UNIQUE INDEX "communities_name_type_district_key" ON "communities"("name", "type", "district");

-- CreateIndex
CREATE UNIQUE INDEX "support_requests_code_key" ON "support_requests"("code");

-- CreateIndex
CREATE INDEX "support_requests_status_idx" ON "support_requests"("status");

-- CreateIndex
CREATE INDEX "support_requests_category_idx" ON "support_requests"("category");

-- CreateIndex
CREATE INDEX "support_requests_district_idx" ON "support_requests"("district");

-- CreateIndex
CREATE INDEX "support_requests_representative_dni_idx" ON "support_requests"("representative_dni");

-- CreateIndex
CREATE INDEX "support_requests_created_at_idx" ON "support_requests"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "ai_classifications_request_id_key" ON "ai_classifications"("request_id");

-- CreateIndex
CREATE INDEX "request_status_history_request_id_created_at_idx" ON "request_status_history"("request_id", "created_at");

-- CreateIndex
CREATE INDEX "request_replies_request_id_created_at_idx" ON "request_replies"("request_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "knowledge_chunks_document_id_chunk_index_key" ON "knowledge_chunks"("document_id", "chunk_index");

-- CreateIndex
CREATE UNIQUE INDEX "request_templates_slug_key" ON "request_templates"("slug");

-- CreateIndex
CREATE INDEX "request_templates_applicant_type_is_active_idx" ON "request_templates"("applicant_type", "is_active");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_faculty_area_id_fkey" FOREIGN KEY ("faculty_area_id") REFERENCES "faculty_areas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_faculty_area_id_fkey" FOREIGN KEY ("faculty_area_id") REFERENCES "faculty_areas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_requests" ADD CONSTRAINT "support_requests_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "communities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_requests" ADD CONSTRAINT "support_requests_suggested_area_id_fkey" FOREIGN KEY ("suggested_area_id") REFERENCES "faculty_areas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_requests" ADD CONSTRAINT "support_requests_assigned_area_id_fkey" FOREIGN KEY ("assigned_area_id") REFERENCES "faculty_areas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_classifications" ADD CONSTRAINT "ai_classifications_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "support_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_classifications" ADD CONSTRAINT "ai_classifications_suggested_area_id_fkey" FOREIGN KEY ("suggested_area_id") REFERENCES "faculty_areas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_status_history" ADD CONSTRAINT "request_status_history_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "support_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_status_history" ADD CONSTRAINT "request_status_history_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_replies" ADD CONSTRAINT "request_replies_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "support_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_chunks" ADD CONSTRAINT "knowledge_chunks_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "knowledge_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
