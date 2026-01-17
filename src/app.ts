import express from "express";
import { healthRouter } from "./routes/health.routes";
import { invoicesRouter } from "./routes/invoices.routes";
import { paymentsRouter } from "./routes/payments.routes";

export function createApp() {
  const app = express();
  app.use(express.json());

  
  app.use(healthRouter);
  app.use("/api", invoicesRouter);
  app.use("/api", paymentsRouter);

  app.get("/api/version", (_req, res) => {
    res.json({
      name: "node-mini-backend",
      version: process.env.APP_VERSION ?? "dev"
    });
  });

  // 404
  app.use((_req, res) => res.status(404).json({ error: "NOT_FOUND" }));

  // error handler
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: any, _req: any, res: any, _next: any) => {
    console.error(err);
    res.status(500).json({ error: "INTERNAL_ERROR" });
  });

  return app;
}
