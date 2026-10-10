-- AlterTable
ALTER TABLE "app_users" ADD COLUMN     "ativo" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "bloqueado" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "motivos" (
    "id" TEXT NOT NULL,
    "id_user" TEXT NOT NULL,
    "motivo" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "motivos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "motivos_id_user_idx" ON "motivos"("id_user");

-- AddForeignKey
ALTER TABLE "motivos" ADD CONSTRAINT "motivos_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
