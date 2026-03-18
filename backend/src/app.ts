import express from "express";
import cors from "cors";
import { cajaRouter } from "./routes/caja.routes.js";
import { gastosRouter } from "./routes/gastos.routes.js";
import { erpRouter } from "./routes/erp.routes.js";
import { authRouter } from "./routes/auth.routes.js";
import { configRouter } from "./routes/config.routes.js";

export const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api", authRouter);
app.use("/api", cajaRouter);
app.use("/api", gastosRouter);
app.use("/api", erpRouter);
app.use("/api", configRouter);
