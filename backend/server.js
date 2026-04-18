import express from "express";
import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import cors from "cors";
import { authRouter } from "./src/routes/auth.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadEnv() {
  const dotenvConfigPath = process.env.DOTENV_CONFIG_PATH;
  const explicitPath = dotenvConfigPath
    ? path.isAbsolute(dotenvConfigPath)
      ? dotenvConfigPath
      : path.resolve(process.cwd(), dotenvConfigPath)
    : null;

  const nodeEnv = process.env.NODE_ENV;
  const isDevLike = !nodeEnv || nodeEnv === "development" || nodeEnv === "dev";

  const candidates = [
    explicitPath,
    nodeEnv ? path.join(__dirname, `.env.${nodeEnv}`) : null,
    isDevLike ? path.join(__dirname, ".env.development") : null,
    path.join(__dirname, ".env")
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      // Ensure the selected env file wins even if the variable is already set
      // (e.g. leftover shell/system env vars or other loaders).
      dotenv.config({ path: candidate, override: true });
      if (process.env.DEBUG_ENV) {
        console.log(`[env] loaded: ${candidate}`);
      }
      return candidate;
    }
  }

  if (process.env.DEBUG_ENV) {
    console.log("[env] no env file found; relying on process.env");
  }
  return null;
}

loadEnv();

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());

const corsOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: corsOrigins.length ? corsOrigins : true
  })
);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use(authRouter);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
