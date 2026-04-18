import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.ts";
import { AuthController } from "../controllers/AuthController.ts";

export const authRouter = Router();

authRouter.post("/sign-up", (req, res) => AuthController.signUp(req, res));

authRouter.post("/sign-in", (req, res) => AuthController.signIn(req, res));

authRouter.get("/me", requireAuth, (req, res) => AuthController.me(req, res));

authRouter.post("/sign-out", requireAuth, (req, res) => AuthController.signOut(req, res));
