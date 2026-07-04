import { Prisma } from "@prisma/client";


export function notFoundHandler(req, res, next) {
  const error = new Error("Recurso não encontrado.");
  error.status = 404;
  next(error);
}


export function errorHandler(err, req, res, next) {
  let status = err.status || 500;
  let mensagemParaOCliente = "Ocorreu um erro interno. Por favor, tente novamente mais tarde.";
  let origemDoErro = "API (CÓDIGO/SERVIDOR)";

  if (err instanceof Prisma.PrismaClientKnownRequestError || 
      err instanceof Prisma.PrismaClientUnknownRequestError ||
      err instanceof Prisma.PrismaClientInitializationError) {
    origemDoErro = "BANCO DE DADOS (PRISMA/SUPABASE)";
    status = 500;
    if (err.code) {
      origemDoErro += ` - Código Prisma: ${err.code}`;
    }
  }

  if (err.message && (err.message.includes("sensor") || err.message.includes("hardware") || req.originalUrl.includes("Metrics"))) {
    origemDoErro = "HARDWARE / SENSORES (Temperatura, Umidade ou Nível do Silo)";
    status = err.status || 400; 
    mensagemParaOCliente = "Dados enviados pelos sensores estão inconsistentes ou inválidos.";
  }

  if (status < 500) {
    origemDoErro = "API (REGRA DE NEGÓCIO DO CLIENTE)";
    mensagemParaOCliente = err.message || "Requisição inválida.";
  }

  console.error(`\n======================================================`);
  console.error(`🚨 [DIAGNÓSTICO DE ERRO]`);
  console.error(`📍 Rota afetada: ${req.method} ${req.originalUrl}`);
  console.error(`🔍 Origem provável: ${origemDoErro}`);
  console.error(`💬 Mensagem original: ${err.message}`);
  if (err.stack && status >= 500) {
    console.error(`📜 Detalhes técnicos (Stack Trace):\n${err.stack}`);
  }
  console.error(`======================================================\n`);

  res.status(status).json({
    erro: mensagemParaOCliente
  });
}
