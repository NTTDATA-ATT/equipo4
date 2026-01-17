import { Router } from "express";
import type { Store } from "../infra/store";
import { Errors } from "../domain/errors";
import { asyncHandler } from "../http/async-handler";

export function packagesRouter(store: Store) {
  const r = Router();

  r.get("/packages", asyncHandler(async (_req, res) => {
    res.json({ items: Array.from(store.packages.values()) });
  }));

  r.get("/packages/:id", asyncHandler(async (req, res) => {
    const pkg = store.packages.get(req.params.id);
    if (!pkg) throw Errors.packageNotFound();
    res.json(pkg);
  }));

  return r;
}
