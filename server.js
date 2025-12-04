import 'dotenv/config';
import express from "express";
import { PrismaClient } from "@prisma/client";

import superjson from "superjson";
import { Decimal } from "@prisma/client/runtime/library";

const app = express();
const PORT = 3000;
const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

app.use(express.json());
//
// ====================================================
//  Função para calcular o percentual do silo
// ====================================================
function getPercentage(value) {
  const numericValue = (typeof value === 'number') ? value : value.toNumber();
  const total = 200.0;
  return (numericValue / total) * 100;
}

// ====================================================
//  Rota 1: Criar um Novo Silo (POST)
// ====================================================
app.post("/silo", async (req, res) => {
  const { name, sensorCode } = req.body;

  if (!name || !sensorCode) {
    return res.status(400).json({ erro: "Nome e código do sensor são obrigatórios." });
  }

  try {
    const newSilo = await prisma.silo.create({
      data: {
        name,
        sensorCode,
      },
    });

    const serialized = superjson.serialize({
      message: "Silo criado com sucesso.",
      silo: newSilo,
    });

    res.status(201).json(serialized.json);
  } catch (error) {
  
    if (error.code === 'P2002') {
        return res.status(409).json({ erro: "Código do sensor (sensorCode) já existe." });
    }
    console.error("Erro ao criar Silo:", error);
    res.status(500).json({ erro: "Erro interno ao criar Silo." });
  }
});

// =====================================================
//  Rota 2: Criar Nova Unidade Ambiental (POST)
// ======================================================
app.post("/environmentalMetrics", async (req, res) => {
  const { name, sensorCode } = req.body;

  if (!name || !sensorCode) {
    return res.status(400).json({ erro: "Nome e código do sensor são obrigatórios." });
  }

  try {
    const newUnit = await prisma.environmentalMetrics.create({
      data: {
        name,
        sensorCode,
      },
    });

    const serialized = superjson.serialize({
      message: "Unidade Ambiental criada com sucesso.",
      unit: newUnit,
    });

    res.status(201).json(serialized.json);
  } catch (error) {
    if (error.code === 'P2002') {
        return res.status(409).json({ erro: "Código do sensor (sensorCode) já existe." });
    }
    console.error("Erro ao criar Unidade Ambiental:", error);
    res.status(500).json({ erro: "Erro interno ao criar Unidade Ambiental." });
  }
});

// ====================================================
//  Rota 3: Listar Todos os Silos (GET)
// ====================================================
app.get("/silos", async (req, res) => {
  try {
    const silos = await prisma.silo.findMany({
      include: {
        levelData: {
          orderBy: { timestamp: "desc" },
          take: 20, 
        },
      },
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
});

// ====================================================
//  Rota 4: Listar Todas as Unidades Ambientais 
// ====================================================
app.get("/environmentalMetrics", async (req, res) => {
  try {
    const units = await prisma.environmentalMetrics.findMany({
      include: {
        data: {
          orderBy: { timestamp: "desc" },
          take: 20, 
        },
      },
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
    console.error("Erro ao listar unidades ambientais:", error);
    res.status(500).json({ erro: "Erro ao buscar unidades ambientais." });
  }
});

// ====================================================
//  Nova leitura do Silo 
// ====================================================
app.post("/silo/reading", async (req, res) => {
  const { silo_id, level_value } = req.body;

  try {
    const silo = await prisma.silo.findUnique({
      where: { id: parseInt(silo_id) }
    });

    if (!silo) {
      return res.status(404).json({ erro: "Silo não encontrado." });
    }

    const reading = await prisma.siloLevelData.create({
      data: {
        levelValue: parseFloat(level_value),
        levelPercentage: getPercentage(parseFloat(level_value)),
        timestamp: new Date(),
        silo: { connect: { id: silo.id } } 
      },
      include: {
        silo: {
          select: { name: true } 
        }
      }
    });

    const serialized = superjson.serialize({
      message: "Leitura registrada.",
      silo_id: silo.id,
      silo_name: reading.silo.name,
      level_value: parseFloat(reading.levelValue.toString()),
      percentage: parseFloat(reading.levelPercentage.toString()),
      timestamp: reading.timestamp
    });

    res.status(201).json(serialized.json);
  } catch (error) {
    console.error("Erro ao registrar leitura do silo:", error);
    res.status(500).json({ erro: "Erro ao salvar leitura do silo." });
  }
});

// ====================================================
//  Rota 5: Listar Últimas 10 Leituras de Silo (GET)
// ====================================================
app.get("/silo/reading", async (req, res) => {
  try {
  
    const readings = await prisma.siloLevelData.findMany({ 
      orderBy: { timestamp: "desc" },
      take: 10,
    });
    
    const formattedReadings = readings.map(r => ({
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
});

// ====================================================
//  Nova leitura ambiental (POST existente)
// ====================================================
app.post("/environment/reading", async (req, res) => {
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
      message: "Leitura ambiental registrada.",
      data: {
        id: reading.id,
        temperature: parseFloat(reading.temperature.toString()),
        humidity: parseFloat(reading.humidity.toString()),
        timestamp: reading.timestamp,
      },
    });

    res.status(201).json(serialized.json);
  } catch (error) {
    console.error("Erro ao registrar leitura ambiental:", error);
    res.status(500).json({ erro: "Erro ao salvar leitura ambiental." });
  }
});

// ====================================================
// 🌡️ GET - Último registro de Temperatura e Umidade (Existente)
// ====================================================
app.get("/environment/latest", async (req, res) => {
  try {
    const latestData = await prisma.environmentalData.findFirst({
      orderBy: { timestamp: "desc" },
    });

    if (!latestData)
      return res.status(404).json({ erro: "Nenhum dado ambiental encontrado." });

    const serialized = superjson.serialize({
      message: "Último dado ambiental encontrado.",
      data: {
        id: latestData.id,
        temperature: parseFloat(latestData.temperature.toString()),
        humidity: parseFloat(latestData.humidity.toString()),
        timestamp: latestData.timestamp,
      },
    });

    res.json(serialized.json);
  } catch (error) {
    console.error("Erro ao buscar último dado ambiental:", error);
    res.status(500).json({ erro: "Erro ao buscar último dado ambiental." });
  }
});

// ====================================================
// 🌾 Rota padrão (Existente)
// ====================================================
app.get("/", (req, res) => {
  res.status(200).send('<h2 style="text-align:center">🌾 API Feed Silo Monitor Online 🚀</h2>');
});

app.listen(PORT, () => console.log(`✅ API rodando na porta ${PORT}`));