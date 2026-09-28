-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('PENDING', 'SIGNED', 'REFUSED');

-- CreateTable
CREATE TABLE "ContractCourseConfig" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "coordenadorNome" TEXT NOT NULL,
    "coordenadorCpf" TEXT NOT NULL,
    "coordenadorEndereco" TEXT NOT NULL,
    "coordenadorNumero" TEXT NOT NULL,
    "coordenadorBairro" TEXT NOT NULL,
    "coordenadorCidade" TEXT NOT NULL,
    "coordenadorEstado" TEXT NOT NULL,
    "coordenadorCep" TEXT NOT NULL,
    "coordenadorEstadoCivil" TEXT NOT NULL,
    "coordenadorProfissao" TEXT NOT NULL,
    "coordenadorEmail" TEXT NOT NULL,
    "eventoCidade" TEXT NOT NULL,
    "eventoDatas" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdByUserId" TEXT,

    CONSTRAINT "ContractCourseConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contract" (
    "id" TEXT NOT NULL,
    "configId" TEXT NOT NULL,
    "nomeCompleto" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "endereco" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "bairro" TEXT NOT NULL,
    "cidade" TEXT NOT NULL,
    "estado" TEXT NOT NULL,
    "cep" TEXT NOT NULL,
    "estadoCivil" TEXT NOT NULL,
    "profissao" TEXT NOT NULL,
    "status" "ContractStatus" NOT NULL DEFAULT 'PENDING',
    "autentiqueDocumentId" TEXT,
    "signUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "signedAt" TIMESTAMP(3),

    CONSTRAINT "Contract_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Contract_autentiqueDocumentId_idx" ON "Contract"("autentiqueDocumentId");

-- CreateIndex
CREATE INDEX "Contract_createdAt_idx" ON "Contract"("createdAt");

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_configId_fkey" FOREIGN KEY ("configId") REFERENCES "ContractCourseConfig"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- RowLevelSecurity
ALTER TABLE "ContractCourseConfig" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Contract" ENABLE ROW LEVEL SECURITY;
