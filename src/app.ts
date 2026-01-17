import express from "express";
import type { Store } from "./infra/store";
import { packagesRouter } from "./routes/packages.routes";
import { invoicesRouter } from "./routes/invoices.routes";
import { paymentsRouter } from "./routes/payments.routes";
import { errorMiddleware } from "./http/error-middleware";

export function buildApp(store: Store) {
  const app = express();
  app.use(express.json());

  app.get("/health", (_req, res) => res.json({ ok: true }));

  app.use(packagesRouter(store));
  app.use(invoicesRouter(store));
  app.use(paymentsRouter(store));

  // último middleware
  app.use(errorMiddleware);

  return app;
}
