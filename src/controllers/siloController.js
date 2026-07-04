import * as siloService from "../services/siloService.js";

export async function createSilo(req, res) {
  const result = await siloService.createSilo(req.body);

  res.status(201).json({
    message: "Silo criado com sucesso.",
    silo: result,
  });
}

export async function listSilos(req, res) {
  const result = await siloService.listSilos();
  res.json(result);
}

export async function createSiloReading(req, res) {
  const result = await siloService.createSiloReading(req.body);
  res.status(201).json(result);
}

export async function updateSilo(req, res) {
  const result = await siloService.updateSilo(req.params.sensor_code, req.body);
  res.json(result);
}

export async function listSiloReadings(req, res) {
  const result = await siloService.listSiloReadings();
  res.json(result);
}

export async function deleteSilo(req, res) {
  const result = await siloService.deleteSilo(req.params.sensor_code);
  res.json(result);
}
