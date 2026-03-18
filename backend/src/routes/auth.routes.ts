import { Router } from "express";
import { loginController, meController, setPasswordController, updateRolAccesoController } from "../controllers/auth.controller.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";

export const authRouter = Router();

authRouter.post("/auth/login", loginController);
authRouter.get("/auth/me", authenticate, meController);
authRouter.post("/auth/set-password", authenticate, setPasswordController);
authRouter.patch("/auth/rol-acceso", authenticate, authorize("ADMIN"), updateRolAccesoController);
