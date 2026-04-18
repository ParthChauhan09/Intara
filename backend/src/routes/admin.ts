import { Router } from "express";
import { Middleware } from "../middleware/Middleware.ts";
import { AdminController } from "../controllers/AdminController.ts";

export const adminRouter = Router();

adminRouter.get("/admin/dashboard-stats", Middleware.requireAdmin, (req, res) => AdminController.getDashboardStats(req, res));
adminRouter.patch("/admin/complaints/update", Middleware.requireAdmin, (req, res) => AdminController.updateComplaintStatus(req, res));
