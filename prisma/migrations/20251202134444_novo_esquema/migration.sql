/*
  Warnings:

  - You are about to drop the `barn` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[sensorCode]` on the table `environmental_metrics` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[sensorCode]` on the table `silo` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `levelPercentage` to the `silo_level_data` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."barn" DROP CONSTRAINT "barn_environmentalMetricsId_fkey";

-- DropForeignKey
ALTER TABLE "public"."barn" DROP CONSTRAINT "barn_siloId_fkey";

-- AlterTable
ALTER TABLE "public"."environmental_data" ALTER COLUMN "timestamp" DROP DEFAULT,
ALTER COLUMN "timestamp" SET DATA TYPE TIMESTAMPTZ(6);

-- AlterTable
ALTER TABLE "public"."silo_level_data" ADD COLUMN     "levelPercentage" DECIMAL(65,30) NOT NULL;

-- DropTable
DROP TABLE "public"."barn";

-- CreateIndex
CREATE UNIQUE INDEX "environmental_metrics_sensorCode_key" ON "public"."environmental_metrics"("sensorCode");

-- CreateIndex
CREATE UNIQUE INDEX "silo_sensorCode_key" ON "public"."silo"("sensorCode");
