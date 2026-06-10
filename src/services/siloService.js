import superjson from "superjson";
import { getPercentage } from "../utils/calculations.js";

import {
  createSilo as createSiloRepository,
  findAllSilos,
  findSiloBySensorCode,
  createReading,
  updateSilo as updateSiloRepository,
  findLastReadings,
  deleteSiloById,
} from "../repositories/siloRepository.js";

export async function createSilo(data) {
  const { name, sensorCode, minLevel, maxLevel } = data;

  if (!name || !sensorCode) {
    throw new Error("Nome e código do sensor são obrigatórios.");
  }

  return createSiloRepository({
    name,
    sensorCode,
    minLevel: parseFloat(minLevel) || 0,
    maxLevel: parseFloat(maxLevel) || 200,
  });
}

export async function listSilos() {
  const silos = await findAllSilos();

  const result = silos.map((silo) => ({
    silo_id: silo.id,
    silo_name: silo.name,
    sensor_code: silo.sensorCode,
    min_level: silo.minLevel,
    max_level: silo.maxLevel,
    last_20_readings: silo.levelData.map((r) => ({
      id: r.id.toString(),
      level_value: parseFloat(r.levelValue.toString()),
      percentage: parseFloat(r.levelPercentage.toString()),
      timestamp: r.timestamp,
    })),
  }));

  return superjson.serialize(result).json;
}

export async function createSiloReading(data) {
  const { sensor_code, level_value } = data;

  const silo = await findSiloBySensorCode(sensor_code);

  if (!silo) {
    throw new Error("Silo não encontrado.");
  }

  const percentage = getPercentage(
    parseFloat(level_value),
    0,
    parseFloat(silo.maxLevel)
  );

  const isCritical =
    parseFloat(level_value) <= parseFloat(silo.minLevel);

  const reading = await createReading({
    levelValue: parseFloat(level_value),
    levelPercentage: percentage,
    timestamp: new Date(),
    siloId: silo.id,
  });

  return {
    message: "Leitura registrada.",
    sensor_code: silo.sensorCode,
    silo_name: silo.name,
    level_value: parseFloat(reading.levelValue),
    percentage: parseFloat(reading.levelPercentage.toFixed(2)),
    status: isCritical ? "CRÍTICO" : "OK",
    timestamp: reading.timestamp,
  };
}

export async function updateSilo(sensorCode, data) {
  const silo = await findSiloBySensorCode(sensorCode);

  if (!silo) {
    throw new Error("Silo não encontrado.");
  }

  return updateSiloRepository(sensorCode, {
    ...(data.name && { name: data.name }),
    ...(data.minLevel && {
      minLevel: parseFloat(data.minLevel),
    }),
    ...(data.maxLevel && {
      maxLevel: parseFloat(data.maxLevel),
    }),
    ...(data.newSensorCode && {
      sensorCode: data.newSensorCode,
    }),
  });
}

export async function listSiloReadings() {
  const readings = await findLastReadings();

  return superjson.serialize(
    readings.map((r) => ({
      id: r.id,
      siloId: r.siloId,
      level_value: parseFloat(r.levelValue.toString()),
      level_percentage: parseFloat(r.levelPercentage.toString()),
      timestamp: r.timestamp,
    }))
  ).json;
}

export async function deleteSilo(sensorCode) {
  const silo = await findSiloBySensorCode(sensorCode);

  if (!silo) {
    throw new Error("Silo não encontrado.");
  }

  await deleteSiloById(silo.id);

  return {
    message: `Silo "${silo.name}" foi excluído com sucesso.`,
  };
}