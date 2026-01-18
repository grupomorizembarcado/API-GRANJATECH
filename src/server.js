import "dotenv/config";
import express from "express";
import siloRoutes from "./routes/silo.routes.js";
import environmentRoutes from "./routes/environment.routes.js";

const app = express();
app.use(express.json());

app.use("/api", siloRoutes);
app.use("/api", environmentRoutes);

app.get("/", (req, res) => {
  res.status(200).send('<h2 style="text-align:center">🌾 API Feed Silo Monitor Online 🚀</h2>');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ API rodando na porta ${PORT}`));
