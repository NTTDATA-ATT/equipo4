import { Router } from "express";
import type { Store } from "../infra/store";
import { Errors } from "../domain/errors";
import { asNonEmptyString, isMsisdnValid } from "../domain/validation";
import { asyncHandler } from "../http/async-handler";

export function invoicesRouter(store: Store) {
  const r = Router();

  r.post("/invoices", asyncHandler(async (req, res) => {
    const msisdn = (req.body ?? {}).msisdn;
    const packageIdRaw = (req.body ?? {}).packageId;

    if (!isMsisdnValid(msisdn)) throw Errors.invalidMsisdn();
    const packageId = asNonEmptyString(packageIdRaw);
    if (!packageId) throw Errors.invalidPackageId();

    const pkg = store.packages.get(packageId);
    if (!pkg) throw Errors.packageNotFound();

    const invoice = store.createInvoice({
      msisdn,
      packageId: pkg.id,
      amountCents: pkg.priceCents,
      currency: pkg.currency
    });

    store.invoices.set(invoice.id, invoice);
    res.status(201).json(invoice);
  }));

  r.get("/invoices/:id", asyncHandler(async (req, res) => {
    const invoice = store.invoices.get(req.params.id);
    if (!invoice) throw Errors.invoiceNotFound();
    res.json(invoice);
  }));

  // debug (opcional)
  r.get("/_debug/invoices", asyncHandler(async (_req, res) => {
    res.json({ items: Array.from(store.invoices.values()) });
  }));

  return r;
}
