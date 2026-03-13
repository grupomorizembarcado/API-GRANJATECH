import prisma from "../config/prisma.js";
import superjson from "superjson";
import { getPercentage } from "../utils/calculations.js";


export async function createSilo(req, res) {
  const { name, sensorCode, minLevel, maxLevel } = req.body;

  if (!name || !sensorCode)
    return res.status(400).json({ erro: "Nome e código do sensor são obrigatórios." });

  try {
    const newSilo = await prisma.silo.create({
      data: {
        name,
        sensorCode,
        minLevel: parseFloat(minLevel) || 0,
        maxLevel: parseFloat(maxLevel) || 200,
      },
    });

    res.status(201).json({
      message: "Silo criado com sucesso.",
      silo: newSilo,
    });
  } catch (error) {
    console.error("Erro ao criar Silo:", error);
    res.status(500).json({ erro: "Erro interno ao criar Silo." });
  }
}

export async function listSilos(req, res) {
  try {
    const silos = await prisma.silo.findMany({
      include: { 
        levelData: { 
          orderBy: { timestamp: "desc" }, 
          take: 20 
        } 
      },
    });

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

    const serialized = superjson.serialize(result);
    res.json(serialized.json);
  } catch (error) {
    console.error("Erro ao listar silos:", error);
    res.status(500).json({ erro: "Erro ao buscar silos." });
  }
}

//leituras do sensores
export async function createSiloReading(req, res) {
  const { sensor_code, level_value } = req.body;

  try {
    const silo = await prisma.silo.findUnique({
      where: { sensorCode: sensor_code },
      select: { id: true, name: true, minLevel: true, maxLevel: true, sensorCode: true },
    });

    if (!silo) {
      return res.status(404).json({ erro: "Silo não encontrado para o código informado." });
    }
    const percentage = getPercentage(
      parseFloat(level_value),
      parseFloat(silo.minLevel),
      parseFloat(silo.maxLevel)
    );

    const reading = await prisma.siloLevelData.create({
      data: {
        levelValue: parseFloat(level_value),
        levelPercentage: percentage,
        timestamp: new Date(),
        siloId: silo.id,
      },
    });

    res.status(201).json({
      message: "Leitura registrada.",
      sensor_code: silo.sensorCode,
      silo_name: silo.name,
      level_value: parseFloat(reading.levelValue),
      percentage: parseFloat(reading.levelPercentage.toFixed(2)),
      timestamp: reading.timestamp,
    });
  } catch (error) {
    console.error("Erro ao registrar leitura do silo:", error);
    res.status(500).json({ erro: "Erro ao salvar leitura do silo." });
  }
}

//passar codigo do sensor  aqui e na leitura 
export async function updateSilo(req, res) {
  const { sensor_code } = req.params;
  const { name, minLevel, maxLevel, newSensorCode } = req.body;

  try {

    const existingSilo = await prisma.silo.findUnique({
      where: { sensorCode: sensor_code },
    });

    if (!existingSilo) {
      return res.status(404).json({ erro: "Silo não encontrado para o código informado." });
    }

    const updated = await prisma.silo.update({
      where: { sensorCode: sensor_code },
      data: {
        ...(name && { name }),
        ...(minLevel && { minLevel: parseFloat(minLevel) }),
        ...(maxLevel && { maxLevel: parseFloat(maxLevel) }),
        ...(newSensorCode && { sensorCode: newSensorCode }),
      },
    });

    res.json({
      message: "Silo atualizado com sucesso.",
      silo: {
        id: updated.id,
        name: updated.name,
        sensor_code: updated.sensorCode,
        min_level: updated.minLevel,
        max_level: updated.maxLevel,
      },
    });
  } catch (error) {
    console.error("Erro ao atualizar silo:", error);
    res.status(500).json({ erro: "Erro ao atualizar silo." });
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

export async function deleteSilo(req, res) {
  let { sensor_code } = req.params;

  
  console.log("Código recebido na URL:", sensor_code);

  try {
   
    const cleanCode = sensor_code.trim();

    const silo = await prisma.silo.findUnique({
      where: { sensorCode: cleanCode }
    });

    
    if (!silo) {
      console.log("Não encontrado com match exato. Tentando busca flexível...");
      
      const fuzzySilo = await prisma.silo.findFirst({
        where: {
          sensorCode: {
            equals: cleanCode,
            mode: 'insensitive' 
          }
        }
      });

      if (!fuzzySilo) {
        return res.status(404).json({ erro: `Silo ${cleanCode} não existe no banco.` });
      }
      
    
      await prisma.silo.delete({ where: { id: fuzzySilo.id } });
    } else {
      await prisma.silo.delete({ where: { id: silo.id } });
    }

    return res.status(200).json({ message: "Excluído com sucesso" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "Erro ao excluir" });
  }
}
