import { Router } from "express";
import { Middleware } from "../middleware/Middleware.ts";
import { AuthController } from "../controllers/AuthController.ts";

export const authRouter = Router();

authRouter.post("/sign-up", (req, res) => AuthController.signUp(req, res));

authRouter.post("/sign-in", (req, res) => AuthController.signIn(req, res));

authRouter.get("/me", Middleware.requireAuth, (req, res) => AuthController.me(req, res));

authRouter.post("/sign-out", Middleware.requireAuth, (req, res) => AuthController.signOut(req, res));
