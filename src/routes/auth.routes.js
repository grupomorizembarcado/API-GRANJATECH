import express from "express";
import { login, createUser } from "../controllers/authController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

//  Rota pública de login
router.post("/login", login);

//  Rota protegida: Apenas ADMIN pode criar novos usuários
router.post(
  "/users",
  authenticateToken,
  authorizeRoles("ADMIN"),
  createUser
);

export default router;
