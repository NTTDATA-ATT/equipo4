import { Router } from "express";
import { InvoicesStore } from "../domain/invoices.store";

export const invoicesRouter = Router();

invoicesRouter.get("/invoices", (_req, res) => {
  res.json(InvoicesStore.list());
});

invoicesRouter.get("/invoices/:id", (req, res) => {
  const inv = InvoicesStore.findById(req.params.id);
  if (!inv) return res.status(404).json({ error: "INVOICE_NOT_FOUND" });
  res.json(inv);
});
