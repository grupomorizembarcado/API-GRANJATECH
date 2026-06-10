import superjson from "superjson";
import * as environmentRepository from "../repositories/environmentRepository.js";

export async function createEnvironmentalUnit(data) {
  const { name, sensorCode } = data;

  if (!name || !sensorCode) {
    throw {
      status: 400,
      message: "Nome e código do sensor são obrigatórios.",
    };
  }

  const unit =
    await environmentRepository.createEnvironmentalUnit(data);

  return superjson.serialize({
    message: "Unidade criada",
    unit,
  }).json;
}

export async function listEnvironmentalUnits() {
  const units =
    await environmentRepository.findAllEnvironmentalUnits();

  const result = units.map((unit) => ({
    unit_id: unit.id,
    unit_name: unit.name,
    sensor_code: unit.sensorCode,
    last_20_readings: unit.data.map((r) => ({
      temperature: parseFloat(r.temperature.toString()),
      humidity: parseFloat(r.humidity.toString()),
      timestamp: r.timestamp,
    })),
  }));

  return superjson.serialize(result).json;
}

export async function createEnvironmentalReading(data) {
  const { metrics_id, temperature, humidity } = data;

  const metrics =
    await environmentRepository.findEnvironmentalUnitById(
      parseInt(metrics_id)
    );

  if (!metrics) {
    throw {
      status: 404,
      message: "Unidade ambiental não encontrada.",
    };
  }

  const reading =
    await environmentRepository.createEnvironmentalReading({
      metricsId: metrics.id,
      temperature: parseFloat(temperature),
      humidity: parseFloat(humidity),
    });

  return superjson.serialize({
    message: "Leitura registrada.",
    data: reading,
  }).json;
}

export async function getLatestEnvironment() {
  const latest =
    await environmentRepository.findLatestEnvironmentalReading();

  if (!latest) {
    throw {
      status: 404,
      message: "Nenhum dado ambiental encontrado.",
    };
  }

  return superjson.serialize({
    message: "Último dado encontrado.",
    data: latest,
  }).json;
}

export async function getAverageEnvironment() {
  const sensors =
    await environmentRepository.findSensorsWithLastReading();

  const validReadings = sensors
    .filter((s) => s.data.length > 0)
    .map((s) => ({
      temperature: Number(s.data[0].temperature),
      humidity: Number(s.data[0].humidity),
    }));

  if (!validReadings.length) {
    throw {
      status: 404,
      message: "Nenhum sensor com leitura disponível.",
    };
  }

  const avgTemperature =
    validReadings.reduce((sum, r) => sum + r.temperature, 0) /
    validReadings.length;

  const avgHumidity =
    validReadings.reduce((sum, r) => sum + r.humidity, 0) /
    validReadings.length;

  return {
    total_sensors: validReadings.length,
    average_temperature: Number(avgTemperature.toFixed(2)),
    average_humidity: Number(avgHumidity.toFixed(2)),
  };
}

export async function resetEnvironmentData() {
  await environmentRepository.resetEnvironmentData();

  return {
    message:
      "Todos os sensores ambientais e suas leituras foram removidos com sucesso.",
  };
}