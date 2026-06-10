import prisma from "../config/prisma.js";

export async function createSilo(data) {
  return prisma.silo.create({ data });
}

export async function findAllSilos() {
  return prisma.silo.findMany({
    include: {
      levelData: {
        orderBy: { timestamp: "desc" },
        take: 20,
      },
    },
  });
}

export async function findSiloBySensorCode(sensorCode) {
  return prisma.silo.findUnique({
    where: { sensorCode },
  });
}

export async function createReading(data) {
  return prisma.siloLevelData.create({
    data,
  });
}

export async function updateSilo(sensorCode, data) {
  return prisma.silo.update({
    where: { sensorCode },
    data,
  });
}

export async function findLastReadings() {
  return prisma.siloLevelData.findMany({
    orderBy: { timestamp: "desc" },
    take: 10,
  });
}

export async function deleteSiloById(id) {
  return prisma.silo.delete({
    where: { id },
  });
}