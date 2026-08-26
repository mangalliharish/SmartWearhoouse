import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import router from "./routes/index.js";
import { logger } from "./lib/logger.js";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  })
);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes
app.use("/api", router);

// Serve static frontend assets if available (Production Full-Stack Deployment)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const possiblePublicDirs = [
  process.env.PUBLIC_DIR,
  path.resolve(process.cwd(), "artifacts", "smartwarehouse", "dist", "public"),
  path.resolve(__dirname, "..", "..", "smartwarehouse", "dist", "public"),
  path.resolve(__dirname, "public"),
].filter((p): p is string => Boolean(p && fs.existsSync(p)));

if (possiblePublicDirs.length > 0) {
  const publicDir = possiblePublicDirs[0];
  app.use(express.static(publicDir));
  app.use((req, res, next) => {
    if (req.method !== "GET" || req.path.startsWith("/api")) {
      return next();
    }
    const indexPath = path.join(publicDir, "index.html");
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      next();
    }
  });
}

export default app;