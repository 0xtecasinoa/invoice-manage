import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { config } from "./config.js";
import { initDb } from "./db/index.js";
import authRoutes, { handleGoogleRedirect, handleGoogleCallback } from "./routes/auth.js";
import projectRoutes from "./routes/projects.js";
import recordRoutes from "./routes/records.js";
import invoiceRoutes from "./routes/invoices.js";
import submissionRoutes from "./routes/submissions.js";
import costRoutes from "./routes/costs.js";
import clientFormatRoutes from "./routes/client-formats.js";

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
  })
);
app.use(express.json());

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: "リクエストが多すぎます。しばらくしてからお試しください。" },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/auth", authLimiter);
// Mount Google OAuth on app so GET /api/auth/google is always registered (avoids 404)
app.get("/api/auth/google", handleGoogleRedirect);
app.get("/api/auth/google/callback", (req, res) => void handleGoogleCallback(req, res));
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/records", recordRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/submissions", submissionRoutes);
app.use("/api/costs", costRoutes);
app.use("/api/client-formats", clientFormatRoutes);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use((_req, res) => {
  res.status(404).json({ error: "Not Found" });
});

async function main() {
  await initDb();
  app.listen(config.port, () => {
    console.log(`Server running at http://localhost:${config.port}`);
  });
}
main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
