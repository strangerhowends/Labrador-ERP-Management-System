import { Router } from "express";
import { deleteCajaController, getCaja, postCaja, putCaja } from "../controllers/caja.controller.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";

export const cajaRouter = Router();

cajaRouter.get("/caja", getCaja);
cajaRouter.post("/caja", postCaja);
cajaRouter.put("/caja/:id", authenticate, authorize("ADMIN"), putCaja);
cajaRouter.delete("/caja/:id", authenticate, authorize("ADMIN"), deleteCajaController);
