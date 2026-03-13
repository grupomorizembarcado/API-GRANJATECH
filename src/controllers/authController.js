import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../config/prisma.js";



// ====================================================
// 🔐 Login Controller
// ====================================================
export async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ erro: "Email e senha são obrigatórios." });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });


    if (!user) {
      return res.status(401).json({ erro: "Credenciais inválidas." });
    }
console.log("DEBUG USER:", user);
console.log("DEBUG PASSWORD RECEBIDA:", password);

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ erro: "Credenciais inválidas." });
    }
    console.log("DEBUG JWT_SECRET:", process.env.JWT_SECRET);

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || "24h",
      }
    );

    res.status(200).json({
      message: "Login realizado com sucesso.",
      token,
    });
  } catch (error) {
    console.error("Erro no login:", error);
    res.status(500).json({ erro: "Erro interno no login." });
  }
}
