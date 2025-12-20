import { PrismaClient } from "@prisma/client";
import superjson from "superjson";

const prisma = new PrismaClient();

export async function createEnvironmentalUnit(req, res) {
  const { name, sensorCode } = req.body;

  if (!name || !sensorCode)
    return res.status(400).json({ erro: "Nome e código do sensor são obrigatórios." });

  try {
    const newUnit = await prisma.environmentalMetrics.create({ data: { name, sensorCode } });
    const serialized = superjson.serialize({ message: "Unidade criada", unit: newUnit });
    res.status(201).json(serialized.json);
  } catch (error) {
    if (error.code === "P2002")
      return res.status(409).json({ erro: "Código do sensor (sensorCode) já existe." });
    res.status(500).json({ erro: "Erro ao criar unidade ambiental." });
  }
}

export async function listEnvironmentalUnits(req, res) {
  try {
    const units = await prisma.environmentalMetrics.findMany({
      include: { data: { orderBy: { timestamp: "desc" }, take: 20 } },
    });

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

    const serialized = superjson.serialize(result);
    res.json(serialized.json);
  } catch (error) {
    res.status(500).json({ erro: "Erro ao buscar unidades ambientais." });
  }
}

export async function createEnvironmentalReading(req, res) {
  const { metrics_id, temperature, humidity } = req.body;

  try {
    const metrics = await prisma.environmentalMetrics.findUnique({
      where: { id: parseInt(metrics_id) },
    });

    if (!metrics)
      return res.status(404).json({ erro: "Unidade ambiental não encontrada." });

    const reading = await prisma.environmentalData.create({
      data: {
        metricsId: metrics.id,
        temperature: parseFloat(temperature),
        humidity: parseFloat(humidity),
        timestamp: new Date(),
      },
    });

    const serialized = superjson.serialize({
      message: "Leitura registrada.",
      data: reading,
    });

    res.status(201).json(serialized.json);
  } catch (error) {
    res.status(500).json({ erro: "Erro ao salvar leitura ambiental." });
  }
}

export async function getLatestEnvironment(req, res) {
  try {
    const latestData = await prisma.environmentalData.findFirst({
      orderBy: { timestamp: "desc" },
    });
    if (!latestData)
      return res.status(404).json({ erro: "Nenhum dado ambiental encontrado." });

    const serialized = superjson.serialize({
      message: "Último dado encontrado.",
      data: latestData,
    });

    res.json(serialized.json);
  } catch (error) {
    res.status(500).json({ erro: "Erro ao buscar último dado ambiental." });
  }
}

export async function getAverageEnvironment(req, res) {
  try {
    const sensors = await prisma.environmentalMetrics.findMany({
      include: { data: { orderBy: { timestamp: "desc" }, take: 1 } },
    });

    const validReadings = sensors
      .filter((s) => s.data.length > 0)
      .map((s) => ({
        temperature: parseFloat(s.data[0].temperature.toString()),
        humidity: parseFloat(s.data[0].humidity.toString()),
      }));

    if (validReadings.length === 0)
      return res.status(404).json({ erro: "Nenhum sensor com leitura disponível." });

    const avgTemperature =
      validReadings.reduce((sum, r) => sum + r.temperature, 0) / validReadings.length;
    const avgHumidity =
      validReadings.reduce((sum, r) => sum + r.humidity, 0) / validReadings.length;

    res.json({
      total_sensors: validReadings.length,
      average_temperature: avgTemperature.toFixed(2),
      average_humidity: avgHumidity.toFixed(2),
    });
  } catch (error) {
    res.status(500).json({ erro: "Erro ao calcular média ambiental." });
  }
}
export async function resetEnvironmentData(req, res) {
  try {
    await prisma.$transaction([
      prisma.environmentalData.deleteMany(),
      prisma.environmentalMetrics.deleteMany(),
    ]);

    res.status(200).json({
      message: "Todos os sensores ambientais e suas leituras foram removidos com sucesso.",
      deleted: {
        environmentalData: "todos",
        environmentalMetrics: "todos",
      },
    });
  } catch (error) {
    console.error("Erro ao resetar sensores ambientais:", error);
    res.status(500).json({
      erro: "Erro ao apagar dados dos sensores ambientais.",
    });
  }
}
