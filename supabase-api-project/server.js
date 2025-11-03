import "dotenv/config"; // Deve ser a primeira importação
import express from "express";
import { PrismaClient } from "@prisma/client"; // Importa e carrega as variáveis de ambiente do .env

const app = express();
// Define a porta, preferindo a variável de ambiente PORT se existir, senão usa 3000
const PORT = process.env.PORT || 3000; 

// A PrismaClient irá automaticamente usar a DATABASE_URL do .env
let prisma;
try {
  prisma = new PrismaClient();
} catch (error) {
  console.error("Erro ao instanciar o Prisma Client:", error);
  process.exit(1); // Encerra a aplicação se não conseguir conectar ao banco
}

app.use(express.json());

// Função utilitária para calcular o percentual
function getPercentage(value) {
  const total = 200.0; // capacidade total do silo (exemplo)
  if (typeof value !== "number" || isNaN(value)) return null;
  return (value / total) * 100;
}

// =============================================
// 📌 Rota: Criar novo Barn com Silo e Unidade Ambiental
// =============================================
app.post("/barn", async (req, res) => {
  const { barn_name, silo_sensor_code, env_sensor_code } = req.body;

  try {
    const newBarn = await prisma.barn.create({
      data: {
        name: barn_name,
        silo: {
          create: {
            sensorCode: silo_sensor_code,
          },
        },
        environmentalMetrics: {
          create: {
            sensorCode: env_sensor_code,
          },
        },
      },
      include: {
        silo: true,
        environmentalMetrics: true,
      },
    });

    res.status(201).json({
      message: "Barn criado com sucesso",
      barn: newBarn,
    });
  } catch (error) {
    console.error("Erro ao criar barn:", error);
    res.status(500).json({ erro: "Erro ao criar barn no banco de dados." });
  }
});

// =============================================
// 📌 Rota: Nova leitura de nível do Silo
// =============================================
app.post("/silo/reading", async (req, res) => {
  const { silo_id, level_value } = req.body;

  try {
    // Garante que o ID é um número inteiro
    const siloIdInt = parseInt(silo_id);
    if (isNaN(siloIdInt)) {
        return res.status(400).json({ erro: "ID do Silo inválido." });
    }

    const silo = await prisma.silo.findUnique({
      where: { id: siloIdInt },
    });

    if (!silo) {
      return res.status(404).json({ erro: "Silo não encontrado." });
    }

    // Garante que o valor de nível é um número decimal
    const levelValueFloat = parseFloat(level_value);
    if (isNaN(levelValueFloat)) {
        return res.status(400).json({ erro: "Valor de nível inválido." });
    }

    const reading = await prisma.siloLevelData.create({
      data: {
        siloId: silo.id,
        levelValue: levelValueFloat,
        timestamp: new Date(),
      },
    });

    res.status(201).json({
      message: "Leitura de nível registrada com sucesso.",
      silo_id: silo.id,
      level_value: reading.levelValue,
      percentage: getPercentage(levelValueFloat),
      timestamp: reading.timestamp,
    });
  } catch (error) {
    console.error("Erro ao registrar leitura:", error);
    res.status(500).json({ erro: "Erro ao salvar dados de nível no banco." });
  }
});

// =============================================
// 📌 Rota: Consultar Silos com último valor registrado
// =============================================
app.get("/silos", async (req, res) => {
  try {
    const silos = await prisma.silo.findMany({
      include: {
        levelData: {
          orderBy: { timestamp: "desc" },
          take: 1,
        },
      },
    });

    const result = silos.map((silo) => {
      const lastReading = silo.levelData[0];
      const levelValue = lastReading ? lastReading.levelValue.toNumber() : null; // Converte Decimal para Number
      return {
        id: silo.id,
        sensor_code: silo.sensorCode,
        last_level_value: levelValue,
        last_percentage: levelValue ? getPercentage(levelValue) : null,
        last_timestamp: lastReading ? lastReading.timestamp : null,
        consulted_at: new Date(),
      };
    });

    res.json(result);
  } catch (error) {
    console.error("Erro ao buscar silos:", error);
    res.status(500).json({ erro: "Erro ao buscar os silos." });
  }
});

// =============================================
// 📌 Rota: Nova leitura ambiental (temperatura e umidade)
// =============================================
app.post("/environment/reading", async (req, res) => {
  const { metrics_id, temperature, humidity } = req.body;

  try {
    // Garante que o ID é um número inteiro
    const metricsIdInt = parseInt(metrics_id);
    if (isNaN(metricsIdInt)) {
        return res.status(400).json({ erro: "ID da Unidade Ambiental inválido." });
    }

    const metrics = await prisma.environmentalMetrics.findUnique({
      where: { id: metricsIdInt },
    });

    if (!metrics) {
      return res.status(404).json({ erro: "Unidade ambiental não encontrada." });
    }

    // Garante que os valores são números decimais
    const temperatureFloat = parseFloat(temperature);
    const humidityFloat = parseFloat(humidity);
    if (isNaN(temperatureFloat) || isNaN(humidityFloat)) {
        return res.status(400).json({ erro: "Valores de temperatura ou umidade inválidos." });
    }

    const newReading = await prisma.environmentalData.create({
      data: {
        metricsId: metrics.id,
        temperature: temperatureFloat,
        humidity: humidityFloat,
        timestamp: new Date(),
      },
    });

    res.status(201).json({
      message: "Leitura ambiental registrada com sucesso.",
      temperature: newReading.temperature,
      humidity: newReading.humidity,
      timestamp: newReading.timestamp,
    });
  } catch (error) {
    console.error("Erro ao registrar leitura ambiental:", error);
    res.status(500).json({ erro: "Erro ao salvar dados ambientais no banco." });
  }
});

// =============================================
// 📌 Rota: Consultar leituras ambientais atuais
// =============================================
app.get("/environment", async (req, res) => {
  try {
    const metricsUnits = await prisma.environmentalMetrics.findMany({
      include: {
        data: {
          orderBy: { timestamp: "desc" },
          take: 1,
        },
      },
    });

    const result = metricsUnits.map((unit) => {
      const last = unit.data[0];
      const temperature = last ? last.temperature.toNumber() : null; // Converte Decimal para Number
      const humidity = last ? last.humidity.toNumber() : null; // Converte Decimal para Number
      return {
        id: unit.id,
        sensor_code: unit.sensorCode,
        temperature: temperature,
        humidity: humidity,
        last_timestamp: last ? last.timestamp : null,
        consulted_at: new Date(),
      };
    });

    res.json(result);
  } catch (error) {
    console.error("Erro ao buscar dados ambientais:", error);
    res.status(500).json({ erro: "Erro ao buscar dados ambientais." });
  }
});

// =============================================
// 📌 Rota padrão
// =============================================
app.get("/", (req, res) => {
  res.status(200).send('<h1 style="text-align: center">API Feed Silo Monitor - Online 🚀</h1>');
});

// =============================================
// 📡 Inicializar servidor
// =============================================
app.listen(PORT, () => console.log(`✅ API rodando na porta ${PORT}`));
