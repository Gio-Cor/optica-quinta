import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import dotenv from "dotenv";
import { createProxyMiddleware } from "http-proxy-middleware";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Intercept all /api calls and proxy them to the backend running on port 3001
  app.use(
    "/api",
    createProxyMiddleware({
      target: "http://localhost:3001",
      changeOrigin: true,
    })
  );

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // The backend API endpoints have been migrated to the PostgreSQL backend (Backend/src/index.ts).
  // This server.ts file is now only responsible for serving the Vite frontend in development and production modes.

  // Vite middleware for development / Production static server
  const isDev = process.env.NODE_ENV === "development" || !fs.existsSync(path.join(process.cwd(), "dist"));
  
  if (isDev) {
    console.log("Starting server in DEVELOPMENT mode (Vite Dev Server)...");
    const vite = await createViteServer({
      server: { middlewareMode: true, allowedHosts: true },
      appType: "spa",
      root: __dirname,
      configFile: path.join(__dirname, "vite.config.ts"),
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in PRODUCTION mode (Serving static build)...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer();
