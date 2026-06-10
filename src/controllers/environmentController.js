import * as environmentService from "../services/environmentService.js";

export async function createEnvironmentalUnit(req, res) {
  try {
    const result = await environmentService.createEnvironmentalUnit(req.body);

    res.status(201).json(result);
  } catch (error) {
    res.status(error.status || 500).json({
      erro: error.message,
    });
  }
}

export async function listEnvironmentalUnits(req, res) {
  try {
    const result = await environmentService.listEnvironmentalUnits();

    res.json(result);
  } catch (error) {
    res.status(500).json({
      erro: error.message,
    });
  }
}

export async function createEnvironmentalReading(req, res) {
  try {
    const result = await environmentService.createEnvironmentalReading(req.body);

    res.status(201).json(result);
  } catch (error) {
    res.status(error.status || 500).json({
      erro: error.message,
    });
  }
}

export async function getLatestEnvironment(req, res) {
  try {
    const result = await environmentService.getLatestEnvironment();

    res.json(result);
  } catch (error) {
    res.status(error.status || 500).json({
      erro: error.message,
    });
  }
}

export async function getAverageEnvironment(req, res) {
  try {
    const result = await environmentService.getAverageEnvironment();

    res.json(result);
  } catch (error) {
    res.status(error.status || 500).json({
      erro: error.message,
    });
  }
}

export async function resetEnvironmentData(req, res) {
  try {
    const result = await environmentService.resetEnvironmentData();

    res.json(result);
  } catch (error) {
    res.status(500).json({
      erro: error.message,
    });
  }
}