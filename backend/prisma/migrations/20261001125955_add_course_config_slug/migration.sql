-- AlterTable: adiciona slug, começando nullable pra poder preencher as linhas
-- existentes antes de travar como NOT NULL + UNIQUE.
ALTER TABLE "ContractCourseConfig" ADD COLUMN "slug" TEXT;

-- Backfill: gera um slug a partir do label pras turmas já cadastradas,
-- usando os 6 primeiros caracteres do id como sufixo pra garantir unicidade.
UPDATE "ContractCourseConfig"
SET "slug" = lower(regexp_replace(regexp_replace(trim("label"), '[^a-zA-Z0-9]+', '-', 'g'), '(^-|-$)', '', 'g'))
             || '-' || substr("id", 1, 6)
WHERE "slug" IS NULL;

ALTER TABLE "ContractCourseConfig" ALTER COLUMN "slug" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "ContractCourseConfig_slug_key" ON "ContractCourseConfig"("slug");
