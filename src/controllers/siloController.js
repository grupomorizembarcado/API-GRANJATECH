import * as siloService from "../services/siloService.js";

export async function createSilo(req, res) {
  try {
    const result = await siloService.createSilo(req.body);

    res.status(201).json({
      message: "Silo criado com sucesso.",
      silo: result,
    });
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
}

export async function listSilos(req, res) {
  try {
    const result = await siloService.listSilos();

    res.json(result);
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
}

export async function createSiloReading(req, res) {
  try {
    const result = await siloService.createSiloReading(req.body);

    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
}

export async function updateSilo(req, res) {
  try {
    const result = await siloService.updateSilo(
      req.params.sensor_code,
      req.body
    );

    res.json(result);
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
}

export async function listSiloReadings(req, res) {
  try {
    const result = await siloService.listSiloReadings();

    res.json(result);
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
}

export async function deleteSilo(req, res) {
  try {
    const result = await siloService.deleteSilo(
      req.params.sensor_code
    );

    res.json(result);
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
}