import { Router } from "express";
import {
  getConfiguracionesController,
  putConfiguracionesController,
} from "../controllers/config.controller.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";

export const configRouter = Router();

// Both endpoints require ADMIN
configRouter.get("/configuraciones", authenticate, authorize("ADMIN"), getConfiguracionesController);
configRouter.put("/configuraciones", authenticate, authorize("ADMIN"), putConfiguracionesController);
