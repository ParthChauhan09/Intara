import { Router } from "express";
import { Middleware } from "../middleware/Middleware.ts";
import { AdminController } from "../controllers/AdminController.ts";

export const operatorRouter = Router();

// Operator shares the same data endpoints as admin — middleware enforces role
operatorRouter.get("/operator/complaints", Middleware.requireOperator, (req, res) => AdminController.getDashboardStats(req, res));
operatorRouter.patch("/operator/complaints/update", Middleware.requireOperator, (req, res) => AdminController.updateComplaintStatus(req, res));
