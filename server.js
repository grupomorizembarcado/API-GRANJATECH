import express from "express";
import { PrismaClient } from "@prisma/client";
import superjson from "superjson";

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
// 🧮 Função para calcular o percentual do silo
// ====================================================
function getPercentage(value) {
  const total = 200.0;
  return (value / total) * 100;
}

// ====================================================
// 📦 Criar Barn (Galpão) com Silo e Unidade Ambiental
// ====================================================
app.post("/barn", async (req, res) => {
  const { barn_name, silo_name, env_name, silo_sensor_code, env_sensor_code } = req.body;

  try {
    const newBarn = await prisma.barn.create({
      data: {
        name: barn_name,
        silo: {
          create: {
            name: silo_name,
            sensorCode: silo_sensor_code,
          },
        },
        environmentalMetrics: {
          create: {
            name: env_name,
            sensorCode: env_sensor_code,
          },
        },
      },
      include: {
        silo: true,
        environmentalMetrics: true,
      },
    });

    const serialized = superjson.serialize({
      message: "Barn criado com sucesso.",
      barn: newBarn,
    });

    res.status(201).json(serialized.json);
  } catch (error) {
    console.error("Erro ao criar Barn:", error);
    res.status(500).json({ erro: "Erro ao criar Barn no banco." });
  }
});

// ====================================================
// ✏️ Editar Barn, Silo ou Unidade Ambiental
// ====================================================
app.put("/barn/:id", async (req, res) => {
  const { id } = req.params;
  const { barn_name, silo_name, env_name, silo_sensor_code, env_sensor_code } = req.body;

  try {
    const barn = await prisma.barn.findUnique({
      where: { id: parseInt(id) },
      include: { silo: true, environmentalMetrics: true },
    });

    if (!barn) return res.status(404).json({ erro: "Barn não encontrado." });

    const updatedBarn = await prisma.barn.update({
      where: { id: parseInt(id) },
      data: {
        name: barn_name ?? barn.name,
        silo: {
          update: {
            name: silo_name ?? barn.silo.name,
            sensorCode: silo_sensor_code ?? barn.silo.sensorCode,
          },
        },
        environmentalMetrics: {
          update: {
            name: env_name ?? barn.environmentalMetrics.name,
            sensorCode: env_sensor_code ?? barn.environmentalMetrics.sensorCode,
          },
        },
      },
      include: { silo: true, environmentalMetrics: true },
    });

    const serialized = superjson.serialize({
      message: "Barn atualizado com sucesso.",
      barn: updatedBarn,
    });

    res.json(serialized.json);
  } catch (error) {
    console.error("Erro ao atualizar Barn:", error);
    res.status(500).json({ erro: "Erro ao atualizar Barn." });
  }
});

// ====================================================
// 📋 Listar todos os Barns com histórico (últimos 20 registros)
// ====================================================
app.get("/barns", async (req, res) => {
  try {
    const barns = await prisma.barn.findMany({
      include: {
        silo: {
          include: {
            levelData: {
              orderBy: { timestamp: "desc" },
              take: 20,
            },
          },
        },
        environmentalMetrics: {
          include: {
            data: {
              orderBy: { timestamp: "desc" },
              take: 20,
            },
          },
        },
      },
    });

    const result = barns.map((b) => ({
      barn_id: b.id,
      barn_name: b.name,
      silo: {
        id: b.silo?.id,
        name: b.silo?.name,
        sensor_code: b.silo?.sensorCode,
        last_20_readings: b.silo?.levelData.map((r) => ({
          level_value: parseFloat(r.levelValue),
          percentage: getPercentage(parseFloat(r.levelValue)),
          timestamp: r.timestamp,
        })),
      },
      environment: {
        id: b.environmentalMetrics?.id,
        name: b.environmentalMetrics?.name,
        sensor_code: b.environmentalMetrics?.sensorCode,
        last_20_readings: b.environmentalMetrics?.data.map((r) => ({
          temperature: parseFloat(r.temperature),
          humidity: parseFloat(r.humidity),
          timestamp: r.timestamp,
        })),
      },
      consulted_at: new Date(),
    }));

    const serialized = superjson.serialize(result);
    res.json(serialized.json);
  } catch (error) {
    console.error("Erro ao listar barns:", error);
    res.status(500).json({ erro: "Erro ao buscar barns." });
  }
});

// ====================================================
// 🌡️ Nova leitura do Silo
// ====================================================
app.post("/silo/reading", async (req, res) => {
  const { silo_id, level_value } = req.body;

  try {
    const silo = await prisma.silo.findUnique({ where: { id: parseInt(silo_id) } });
    if (!silo) return res.status(404).json({ erro: "Silo não encontrado." });

    const reading = await prisma.siloLevelData.create({
      data: {
        siloId: silo.id,
        levelValue: parseFloat(level_value),
        timestamp: new Date(),
      },
    });

    const serialized = superjson.serialize({
      message: "Leitura registrada.",
      silo_id: silo.id,
      level_value: parseFloat(reading.levelValue),
      percentage: getPercentage(parseFloat(reading.levelValue)),
      timestamp: reading.timestamp,
    });

    res.status(201).json(serialized.json);
  } catch (error) {
    console.error("Erro ao registrar leitura do silo:", error);
    res.status(500).json({ erro: "Erro ao salvar leitura do silo." });
  }
});

// ====================================================
// 🌿 Nova leitura ambiental
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
        temperature: parseFloat(reading.temperature),
        humidity: parseFloat(reading.humidity),
        timestamp: reading.timestamp,
      },
    });

    res.status(201).json("Dados salvos com sucesso.");
  } catch (error) {
    console.error("Erro ao registrar leitura ambiental:", error);
    res.status(500).json({ erro: "Erro ao salvar leitura ambiental." });
  }
});

// get silo
app.get("/silo/reading", async (req, res) => {
  try {
    const readings = await prisma.reading.findMany({
      orderBy: { createdAt: "desc" },
      take: 10, // mostra as 10 últimas medições
    });

    res.status(200).json(readings);
  } catch (error) {
    console.error("Erro ao buscar leituras:", error.message);
    res.status(500).json({ error: "Falha ao buscar leituras" });
  }
});

// ====================================================
// 📊 GET - Último registro de Temperatura e Umidade
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
        temperature: parseFloat(latestData.temperature),
        humidity: parseFloat(latestData.humidity),
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
// 🌾 Rota padrão
// ====================================================
app.get("/", (req, res) => {
  res.status(200).send('<h2 style="text-align:center">🌾 API Feed Silo Monitor Online 🚀</h2>');
});

app.listen(PORT, () => console.log(`✅ API rodando na porta ${PORT}`));