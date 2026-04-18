import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.ts";
import { ComplaintController } from "../controllers/ComplaintController.ts";

export const complaintsRouter = Router();

complaintsRouter.get("/complaints", requireAuth, (req, res) => ComplaintController.list(req, res));

complaintsRouter.post("/complaints", requireAuth, (req, res) => ComplaintController.create(req, res));

complaintsRouter.patch("/complaints/update", requireAuth, (req, res) => ComplaintController.updateStatus(req, res));

