import prisma from "../config/prisma.js";

export async function createEnvironmentalUnit(data) {
  return prisma.environmentalMetrics.create({
    data,
  });
}

export async function findAllEnvironmentalUnits() {
  return prisma.environmentalMetrics.findMany({
    include: {
      data: {
        orderBy: {
          timestamp: "desc",
        },
        take: 20,
      },
    },
  });
}

export async function findEnvironmentalUnitById(id) {
  return prisma.environmentalMetrics.findUnique({
    where: { id },
  });
}

export async function createEnvironmentalReading(data) {
  return prisma.environmentalData.create({
    data: {
      ...data,
      timestamp: new Date(),
    },
  });
}

export async function findLatestEnvironmentalReading() {
  return prisma.environmentalData.findFirst({
    orderBy: {
      timestamp: "desc",
    },
  });
}

export async function findSensorsWithLastReading() {
  return prisma.environmentalMetrics.findMany({
    include: {
      data: {
        orderBy: {
          timestamp: "desc",
        },
        take: 1,
      },
    },
  });
}

export async function resetEnvironmentData() {
  return prisma.$transaction([
    prisma.environmentalData.deleteMany(),
    prisma.environmentalMetrics.deleteMany(),
  ]);
}