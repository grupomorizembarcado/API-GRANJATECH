import express from "express";
import {
  createEnvironmentalUnit,
  listEnvironmentalUnits,
  createEnvironmentalReading,
  getLatestEnvironment,
  getAverageEnvironment,
  resetEnvironmentData,   
} from "../controllers/environmentController.js";

const router = express.Router();

router.post("/environmentalMetrics", createEnvironmentalUnit);
router.get("/environmentalMetrics", listEnvironmentalUnits);
router.post("/environment/reading", createEnvironmentalReading);
router.get("/environment/latest", getLatestEnvironment);
router.get("/environment/average", getAverageEnvironment);
router.delete("/environment/reset", resetEnvironmentData); 

export default router;
