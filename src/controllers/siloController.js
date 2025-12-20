import { PrismaClient } from "@prisma/client";
import superjson from "superjson";
import { getPercentage } from "../utils/calculations.js";

const prisma = new PrismaClient();

export async function createSilo(req, res) {
  const { name, sensorCode } = req.body;

  if (!name || !sensorCode)
    return res.status(400).json({ erro: "Nome e código do sensor são obrigatórios." });

  try {
    const newSilo = await prisma.silo.create({ data: { name, sensorCode } });
    const serialized = superjson.serialize({ message: "Silo criado com sucesso.", silo: newSilo });
    res.status(201).json(serialized.json);
  } catch (error) {
    if (error.code === "P2002")
      return res.status(409).json({ erro: "Código do sensor (sensorCode) já existe." });
    console.error("Erro ao criar Silo:", error);
    res.status(500).json({ erro: "Erro interno ao criar Silo." });
  }
}

export async function listSilos(req, res) {
  try {
    const silos = await prisma.silo.findMany({
      include: { levelData: { orderBy: { timestamp: "desc" }, take: 20 } },
    });

    const result = silos.map((silo) => ({
      silo_id: silo.id,
      silo_name: silo.name,
      sensor_code: silo.sensorCode,
      last_20_readings: silo.levelData.map((r) => ({
        level_value: parseFloat(r.levelValue.toString()),
        percentage: getPercentage(r.levelValue),
        timestamp: r.timestamp,
      })),
    }));

    const serialized = superjson.serialize(result);
    res.json(serialized.json);
  } catch (error) {
    console.error("Erro ao listar silos:", error);
    res.status(500).json({ erro: "Erro ao buscar silos." });
  }
}

export async function createSiloReading(req, res) {
  const { silo_id, level_value } = req.body;
  try {
    const silo = await prisma.silo.findUnique({ where: { id: parseInt(silo_id) } });
    if (!silo) return res.status(404).json({ erro: "Silo não encontrado." });

    const reading = await prisma.siloLevelData.create({
      data: {
        levelValue: parseFloat(level_value),
        levelPercentage: getPercentage(parseFloat(level_value)),
        timestamp: new Date(),
        silo: { connect: { id: silo.id } },
      },
      include: { silo: { select: { name: true } } },
    });

    const serialized = superjson.serialize({
      message: "Leitura registrada.",
      silo_id: silo.id,
      silo_name: reading.silo.name,
      level_value: parseFloat(reading.levelValue.toString()),
      percentage: parseFloat(reading.levelPercentage.toString()),
      timestamp: reading.timestamp,
    });

    res.status(201).json(serialized.json);
  } catch (error) {
    console.error("Erro ao registrar leitura do silo:", error);
    res.status(500).json({ erro: "Erro ao salvar leitura do silo." });
  }
}

export async function listSiloReadings(req, res) {
  try {
    const readings = await prisma.siloLevelData.findMany({
      orderBy: { timestamp: "desc" },
      take: 10,
    });

    const formattedReadings = readings.map((r) => ({
      id: r.id,
      siloId: r.siloId,
      level_value: parseFloat(r.levelValue.toString()),
      level_percentage: parseFloat(r.levelPercentage.toString()),
      timestamp: r.timestamp,
    }));

    const serialized = superjson.serialize(formattedReadings);
    res.status(200).json(serialized.json);
  } catch (error) {
    console.error("Erro ao buscar leituras de Silo:", error);
    res.status(500).json({ error: "Falha ao buscar leituras de Silo" });
  }
}
