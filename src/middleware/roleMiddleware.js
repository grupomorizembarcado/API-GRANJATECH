export function authorizeRoles(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        erro: "Usuário não autenticado.",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        erro: "Você não possui permissão para acessar este recurso.",
      });
    }

    next();
  };
}