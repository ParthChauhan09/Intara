import express from "express";
import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import cors from "cors";
import { authRouter } from "./routes/auth.ts";
import { complaintsRouter } from "./routes/complaints.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadEnv(): string | null {
  const dotenvConfigPath = process.env.DOTENV_CONFIG_PATH;
  const explicitPath = dotenvConfigPath
    ? path.isAbsolute(dotenvConfigPath)
      ? dotenvConfigPath
      : path.resolve(process.cwd(), dotenvConfigPath)
    : null;

  const nodeEnv = process.env.NODE_ENV;
  const isDevLike = !nodeEnv || nodeEnv === "development" || nodeEnv === "dev";
  const projectRoot = process.cwd();

  const candidates = [
    explicitPath,
    nodeEnv ? path.join(projectRoot, `.env.${nodeEnv}`) : null,
    isDevLike ? path.join(projectRoot, ".env.development") : null,
    path.join(projectRoot, ".env"),
    nodeEnv ? path.join(__dirname, `.env.${nodeEnv}`) : null,
    isDevLike ? path.join(__dirname, ".env.development") : null,
    path.join(__dirname, ".env")
  ].filter((value): value is string => Boolean(value));

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
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
  .map((value) => value.trim())
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
app.use(complaintsRouter);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
