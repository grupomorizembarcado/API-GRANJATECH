import express from "express";
import {
  createSilo,
  listSilos,
  createSiloReading,
  listSiloReadings,
  updateSilo,
} from "../controllers/siloController.js";

const router = express.Router();

router.post("/silo", createSilo);
router.get("/silos", listSilos);
router.post("/silo/reading", createSiloReading);
router.get("/silo/reading", listSiloReadings);
router.put("/silo/:id", updateSilo);

export default router;
