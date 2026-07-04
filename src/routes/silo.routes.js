import express from "express";
import * as siloController from "../controllers/siloController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
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
// alteração
// Apenas ADMIN
router.post(
  "/silo",
  authenticateToken,
  authorizeRoles("ADMIN"),
  siloController.createSilo
);

router.put(
  "/silo/:sensor_code",
  authenticateToken,
  authorizeRoles("ADMIN"),
  siloController.updateSilo
);

router.delete(
  "/silo/:sensor_code",
  authenticateToken,
  authorizeRoles("ADMIN"),
  siloController.deleteSilo
);

// ADMIN e VIEWER
router.get(
  "/silos",
  authenticateToken,
  authorizeRoles("ADMIN", "VIEWER"),
  siloController.listSilos
);

router.post(
  "/silo/reading",
  authenticateToken,
  authorizeRoles("ADMIN"),
  siloController.createSiloReading
);

router.get(
  "/silo/reading",
  authenticateToken,
  authorizeRoles("ADMIN", "VIEWER"),
  siloController.listSiloReadings
);

