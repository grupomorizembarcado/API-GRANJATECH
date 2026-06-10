import express from "express";
import * as siloController from "../controllers/siloController.js";

const router = express.Router();

// CRUD de Silos
router.post("/silo", siloController.createSilo);
router.get("/silos", siloController.listSilos);
router.put("/silo/:sensor_code", siloController.updateSilo);
router.delete("/silo/:sensor_code", siloController.deleteSilo);

// Leituras
router.post("/silo/reading", siloController.createSiloReading);
router.get("/silo/reading", siloController.listSiloReadings);

export default router;
