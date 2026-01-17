import { Router } from "express";
import { asyncHandler } from "./async-handler";
import type { ListPackages } from "../application/list-packages";
import type { CreateInvoice } from "../application/create-invoice";
import type { PayInvoice } from "../application/pay-invoice";
import { parsePaymentMethod } from "../domain/validation";

export function buildRoutes(deps: {
  listPackages: ListPackages;
  createInvoice: CreateInvoice;
  payInvoice: PayInvoice;
}) {
  const r = Router();

  r.get("/health", (_req, res) => res.json({ ok: true, variant: "solid-fixed" }));

  r.get("/packages", asyncHandler(async (_req, res) => {
    res.json(await deps.listPackages.execute());
  }));

  r.post("/invoices", asyncHandler(async (req, res) => {
    const invoice = await deps.createInvoice.execute({
      msisdn: (req.body ?? {}).msisdn,
      packageId: (req.body ?? {}).packageId,
    });
    res.status(201).json(invoice);
  }));

  r.post("/payments", asyncHandler(async (req, res) => {
    const invoiceId = String((req.body ?? {}).invoiceId ?? "");
    const method = parsePaymentMethod((req.body ?? {}).method);
    const out = await deps.payInvoice.execute({ invoiceId, method });
    res.status(201).json(out);
  }));

  return r;
}
