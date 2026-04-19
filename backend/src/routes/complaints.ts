import { Router } from "express";
import { Middleware } from "../middleware/Middleware.ts";
import { ComplaintController } from "../controllers/ComplaintController.ts";
import multer from "multer";
import os from "node:os";

export const complaintsRouter = Router();

// Configure multer to use system temp dir for seamless Render deployments
const upload = multer({
  dest: os.tmpdir(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB max (Whisper limit)
  fileFilter: (_req, file, cb) => {
    const allowed = ['audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/mp4', 'audio/m4a', 'audio/x-m4a'];
    if (allowed.includes(file.mimetype) || file.originalname.match(/\.(mp3|wav|m4a)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('Only mp3, wav, and m4a audio files are supported.'));
    }
  },
});

complaintsRouter.get("/complaints", Middleware.requireAuth, (req, res) => ComplaintController.list(req, res));

complaintsRouter.post("/complaints", Middleware.requireAuth, (req, res) => ComplaintController.create(req, res));

complaintsRouter.post("/complaints/audio", Middleware.requireAuth, upload.single('audio'), (req, res) => ComplaintController.createFromAudio(req, res));

complaintsRouter.patch("/complaints/update", Middleware.requireAuth, (req, res) => ComplaintController.updateStatus(req, res));

