import { Router } from "express";
import {
	getCatalogosController,
	getDocumentoController,
	getLotesResumenController,
	getResumenDiarioController,
	getResumenPorFechaController,
	postGastos,
	putDocumentoController,
} from "../controllers/gastos.controller.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";

export const gastosRouter = Router();

gastosRouter.post("/gastos", postGastos);
gastosRouter.get("/catalogos", getCatalogosController);
gastosRouter.get("/gastos/lotes-resumen", getLotesResumenController);
gastosRouter.get("/gastos/resumen-diario", getResumenDiarioController);
gastosRouter.get("/gastos/resumen-fecha", getResumenPorFechaController);
gastosRouter.get("/gastos/documento/:id", getDocumentoController);
gastosRouter.put("/gastos/documento/:id", authenticate, authorize("ADMIN"), putDocumentoController);
