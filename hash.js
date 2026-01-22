import bcrypt from "bcrypt";

const senha = "digite-sua-senha";

const hash = await bcrypt.hash(senha, 10);

console.log(hash);