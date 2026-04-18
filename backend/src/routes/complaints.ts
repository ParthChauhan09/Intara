import { Router } from "express";
import { Middleware } from "../middleware/Middleware.ts";
import { ComplaintController } from "../controllers/ComplaintController.ts";

export const complaintsRouter = Router();

complaintsRouter.get("/complaints", Middleware.requireAuth, (req, res) => ComplaintController.list(req, res));

complaintsRouter.post("/complaints", Middleware.requireAuth, (req, res) => ComplaintController.create(req, res));

complaintsRouter.patch("/complaints/update", Middleware.requireAuth, (req, res) => ComplaintController.updateStatus(req, res));

