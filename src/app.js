import express from "express";
import cors from "cors";

import siloRoutes from "./routes/silo.routes.js";
import environmentRoutes from "./routes/environment.routes.js";
import authRoutes from "./routes/auth.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", siloRoutes);
app.use("/api", environmentRoutes);
app.use("/api", authRoutes);

export default app;