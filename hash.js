import bcrypt from "bcrypt";

const senha = "senha123";

const hash = await bcrypt.hash(senha, 10);

console.log(hash);