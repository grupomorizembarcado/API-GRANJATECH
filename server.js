import 'dotenv/config';
import express from "express";
import { PrismaClient } from "@prisma/client";

import superjson from "superjson";
import { Decimal } from "@prisma/client/runtime/library";

import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const app = express();
const PORT = 3000;
const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

app.use(express.json());

// ====================================================
// 🔐 Login
// ====================================================
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ erro: "Email e senha são obrigatórios." });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ erro: "Credenciais inválidas." });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ erro: "Credenciais inválidas." });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || "24h",
      }
    );

    res.status(200).json({
      message: "Login realizado com sucesso.",
      token,
    });
  } catch (error) {
    console.error("Erro no login:", error);
    res.status(500).json({ erro: "Erro interno no login." });
  }
});

// ====================================================
// 🔒 Middleware de Autenticação JWT
// ====================================================
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ erro: "Token não fornecido." });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ erro: "Token inválido ou expirado." });
    }

    req.user = user;
    next();
  });
}

//
// ====================================================
//  Função para calcular o percentual do silo
// ====================================================
function getPercentage(value) {
  const numericValue = (typeof value === 'number') ? value : value.toNumber();
  const total = 200.0;
  return (numericValue / total) * 100;
}

//
// ====================================================
//  Verificação periódica dos sensores ambientais
// ====================================================
setInterval(async () => {
  const TWO_MINUTES = 2 * 60 * 1000;
  const now = new Date();

  const sensors = await prisma.environmentalMetrics.findMany({
    include: {
      data: {
        orderBy: { timestamp: "desc" },
        take: 1,
      },
    },
  });

  sensors.forEach(sensor => {
    if (
      sensor.data.length === 0 ||
      now - new Date(sensor.data[0].timestamp) > TWO_MINUTES
    ) {
      console.warn(`🚨 ALERTA: Sensor ${sensor.sensorCode} sem dados há mais de 2 minutos`);
    }
  });
}, 120 * 1000); // verifica a cada 2 minuto

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
// 🌡️ MÉDIA GLOBAL DE TEMPERATURA E UMIDADE (NOVA)
// ====================================================
app.get("/environment/average", async (req, res) => {
  try {
    // 1. Buscar todos os sensores ambientais
    const sensors = await prisma.environmentalMetrics.findMany({
      include: {
        data: {
          orderBy: { timestamp: "desc" },
          take: 1, // pega SOMENTE a última leitura de cada sensor
        },
      },
    });

    // 2. Filtrar sensores que realmente enviaram dados
    const validReadings = sensors
      .filter(sensor => sensor.data.length > 0)
      .map(sensor => ({
        temperature: parseFloat(sensor.data[0].temperature.toString()),
        humidity: parseFloat(sensor.data[0].humidity.toString()),
        sensorCode: sensor.sensorCode,
        timestamp: sensor.data[0].timestamp,
      }));

    if (validReadings.length === 0) {
      return res.status(404).json({ erro: "Nenhum sensor com leitura disponível." });
    }

    // 3. Calcular médias
    const avgTemperature =
      validReadings.reduce((sum, r) => sum + r.temperature, 0) / validReadings.length;

    const avgHumidity =
      validReadings.reduce((sum, r) => sum + r.humidity, 0) / validReadings.length;

    res.json({
      total_sensors: validReadings.length,
      average_temperature: Number(avgTemperature.toFixed(2)),
      average_humidity: Number(avgHumidity.toFixed(2)),
      sensors_used: validReadings.map(r => r.sensorCode),
    });

  } catch (error) {
    console.error("Erro ao calcular média ambiental:", error);
    res.status(500).json({ erro: "Erro ao calcular média ambiental." });
  }
});

// ====================================================
// 🗑️ Rota: Reset dos Sensores Ambientais
// ====================================================
app.delete("/environment/reset", async (req, res) => {
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
});

// ====================================================
// 🌾 Rota padrão (Existente)
// ====================================================
app.get("/", (req, res) => {
  res.status(200).send('<h2 style="text-align:center">🌾 API Feed Silo Monitor Online 🚀</h2>');
});

app.listen(PORT, () => console.log(`✅ API rodando na porta ${PORT}`));