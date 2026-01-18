import bcrypt from "bcrypt";

const senha = "coloque_sua_senha_aqui";

const hash = await bcrypt.hash(senha, 10);

console.log(hash);