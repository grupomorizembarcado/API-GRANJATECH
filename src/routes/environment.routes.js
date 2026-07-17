import express from "express";
import {
  createEnvironmentalUnit,
  listEnvironmentalUnits,
  createEnvironmentalReading,
  getLatestEnvironment,
  getAverageEnvironment,
  resetEnvironmentData,
} from "../controllers/environmentController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

// Sensores ambientais
router.post("/environmentalMetrics", createEnvironmentalUnit);
router.get("/environmentalMetrics", listEnvironmentalUnits);

// Leituras
router.post("/environment/reading", createEnvironmentalReading);
router.get("/environment/latest", getLatestEnvironment);
router.get("/environment/average", getAverageEnvironment);

// Administração
router.delete("/environment/reset", resetEnvironmentData);

export default router;

//alteração
// Apenas ADMIN
router.post(
  "/environmentalMetrics",
  authenticateToken,
  authorizeRoles("ADMIN"),
  createEnvironmentalUnit
);

router.post(
  "/environment/reading",
  createEnvironmentalReading
);

router.delete(
  "/environment/reset",
  authenticateToken,
  authorizeRoles("ADMIN"),
  resetEnvironmentData
);

// ADMIN e VIEWER
router.get(
  "/environmentalMetrics",
  authenticateToken,
  authorizeRoles("ADMIN", "VIEWER"),
  listEnvironmentalUnits
);

router.get(
  "/environment/latest",
  authenticateToken,
  authorizeRoles("ADMIN", "VIEWER"),
  getLatestEnvironment
);

router.get(
  "/environment/average",
  authenticateToken,
  authorizeRoles("ADMIN", "VIEWER"),
  getAverageEnvironment
);