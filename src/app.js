import express from "express";
import cors from "cors";

import siloRoutes from "./routes/silo.routes.js";
import environmentRoutes from "./routes/environment.routes.js";
import authRoutes from "./routes/auth.routes.js";
import { notFoundHandler, errorHandler } from "./middleware/errorMiddleware.js";

const app = express();


app.use(
  cors({
    origin: ["http://localhost:3000"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);


app.use(express.json());

app.use("/api", siloRoutes);
app.use("/api", environmentRoutes);
app.use("/api", authRoutes);


app.use(notFoundHandler);
app.use(errorHandler);

export default app;
