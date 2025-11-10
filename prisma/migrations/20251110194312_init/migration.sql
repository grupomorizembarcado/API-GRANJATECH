-- CreateTable
CREATE TABLE "public"."barn" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "siloId" INTEGER,
    "environmentalMetricsId" INTEGER,

    CONSTRAINT "barn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."silo" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "sensorCode" TEXT NOT NULL,

    CONSTRAINT "silo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."silo_level_data" (
    "id" BIGSERIAL NOT NULL,
    "levelValue" DECIMAL(65,30) NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "siloId" INTEGER NOT NULL,

    CONSTRAINT "silo_level_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."environmental_metrics" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "sensorCode" TEXT NOT NULL,

    CONSTRAINT "environmental_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."environmental_data" (
    "id" BIGSERIAL NOT NULL,
    "temperature" DECIMAL(65,30) NOT NULL,
    "humidity" DECIMAL(65,30) NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metricsId" INTEGER NOT NULL,

    CONSTRAINT "environmental_data_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "barn_siloId_key" ON "public"."barn"("siloId");

-- CreateIndex
CREATE UNIQUE INDEX "barn_environmentalMetricsId_key" ON "public"."barn"("environmentalMetricsId");

-- AddForeignKey
ALTER TABLE "public"."barn" ADD CONSTRAINT "barn_siloId_fkey" FOREIGN KEY ("siloId") REFERENCES "public"."silo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."barn" ADD CONSTRAINT "barn_environmentalMetricsId_fkey" FOREIGN KEY ("environmentalMetricsId") REFERENCES "public"."environmental_metrics"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."silo_level_data" ADD CONSTRAINT "silo_level_data_siloId_fkey" FOREIGN KEY ("siloId") REFERENCES "public"."silo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."environmental_data" ADD CONSTRAINT "environmental_data_metricsId_fkey" FOREIGN KEY ("metricsId") REFERENCES "public"."environmental_metrics"("id") ON DELETE CASCADE ON UPDATE CASCADE;
