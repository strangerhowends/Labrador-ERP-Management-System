import { Router } from "express";
import {
  getCategoriasController,
  getHorariosController,
  getProductosController,
  getProveedoresController,
  getRemuneracionesSemanalController,
  getTrabajadoresController,
  patchCategoriaController,
  patchProductoController,
  patchProveedorController,
  patchTrabajadorController,
  postCategoriaBulkController,
  postCategoriaController,
  postProductoBulkController,
  postProductoController,
  postProveedorBulkController,
  postProveedorController,
  postRemuneracionController,
  postTrabajadorBulkController,
  postTrabajadorController,
  putCategoriaController,
  putProductoController,
  putProveedorController,
  putRemuneracionController,
  putTrabajadorController,
  deleteRemuneracionController,
  upsertHorarioController,
} from "../controllers/erp.controller.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";

export const erpRouter = Router();

// ── Public read endpoints (used by gastos form too) ──
erpRouter.get("/proveedores", getProveedoresController);
erpRouter.get("/categorias", getCategoriasController);
erpRouter.get("/productos", getProductosController);

// ── Protected: require authentication ──
erpRouter.use(authenticate);

// ── Admin-only CRUD ──
erpRouter.post("/proveedores", authorize("ADMIN"), postProveedorController);
erpRouter.post("/proveedores/bulk", authorize("ADMIN"), postProveedorBulkController);
erpRouter.put("/proveedores/:id", authorize("ADMIN"), putProveedorController);
erpRouter.patch("/proveedores/:id/desactivar", authorize("ADMIN"), patchProveedorController);

erpRouter.post("/categorias", authorize("ADMIN"), postCategoriaController);
erpRouter.post("/categorias/bulk", authorize("ADMIN"), postCategoriaBulkController);
erpRouter.put("/categorias/:id", authorize("ADMIN"), putCategoriaController);
erpRouter.patch("/categorias/:id/desactivar", authorize("ADMIN"), patchCategoriaController);

erpRouter.post("/productos", authorize("ADMIN"), postProductoController);
erpRouter.post("/productos/bulk", authorize("ADMIN"), postProductoBulkController);
erpRouter.put("/productos/:id", authorize("ADMIN"), putProductoController);
erpRouter.patch("/productos/:id/desactivar", authorize("ADMIN"), patchProductoController);

erpRouter.get("/trabajadores", authorize("ADMIN"), getTrabajadoresController);
erpRouter.post("/trabajadores", authorize("ADMIN"), postTrabajadorController);
erpRouter.post("/trabajadores/bulk", authorize("ADMIN"), postTrabajadorBulkController);
erpRouter.put("/trabajadores/:id", authorize("ADMIN"), putTrabajadorController);
erpRouter.patch("/trabajadores/:id/desactivar", authorize("ADMIN"), patchTrabajadorController);

erpRouter.post("/remuneraciones", authorize("ADMIN"), postRemuneracionController);
erpRouter.put("/remuneraciones/:id", authorize("ADMIN"), putRemuneracionController);
erpRouter.delete("/remuneraciones/:id", authorize("ADMIN"), deleteRemuneracionController);
// Remuneraciones semanal: ADMIN sees all, TRABAJADOR sees own
erpRouter.get("/remuneraciones/semanal", getRemuneracionesSemanalController);

// Horarios: both roles can read, only ADMIN can write
erpRouter.get("/horarios", getHorariosController);
erpRouter.post("/horarios", authorize("ADMIN"), upsertHorarioController);
erpRouter.put("/horarios", authorize("ADMIN"), upsertHorarioController);
