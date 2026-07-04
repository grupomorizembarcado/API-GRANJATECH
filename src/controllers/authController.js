import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../config/prisma.js";

// ====================================================
//  Login Controller
// ====================================================
export async function login(req, res) {
  const email = req.body.email?.trim();
  const password = req.body.password?.trim();

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
        role: user.role, // Adicionado para bater com a validação de rotas ADMIN
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

// ====================================================
// 📝 Registro / Cadastro Controller (Recolocado aqui)
// ====================================================
export async function createUser(req, res) {
  try {
    const { name, email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ erro: "Email e senha são obrigatórios." });
    }

    const userExists = await prisma.user.findUnique({ where: { email } });
    if (userExists) {
      return res.status(400).json({ erro: "Este email já está cadastrado." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || "USER",
      },
    });

    res.status(201).json({
      message: "Usuário criado com sucesso.",
      userId: newUser.id
    });
  } catch (error) {
    console.error("Erro no cadastro:", error);
    res.status(500).json({ erro: "Erro interno ao criar usuário." });
  }
}
