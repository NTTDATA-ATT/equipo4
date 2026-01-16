import { Router } from "express";
import { InvoicesStore } from "../domain/invoices.store";
import { assertPositiveAmount, isValidMsisdn } from "../domain/validators";

export const paymentsRouter = Router();

paymentsRouter.post("/payments", (req, res) => {
  const { invoiceId, msisdn, amount } = req.body ?? {};

  if (!invoiceId || typeof invoiceId !== "string") {
    return res.status(400).json({ error: "invoiceId_required" });
  }
  if (!msisdn || typeof msisdn !== "string" || !isValidMsisdn(msisdn)) {
    return res.status(400).json({ error: "msisdn_invalid" });
  }
  try {
    assertPositiveAmount(Number(amount));
  } catch {
    return res.status(400).json({ error: "amount_invalid" });
  }

  const inv = InvoicesStore.findById(invoiceId);
  if (!inv) return res.status(404).json({ error: "INVOICE_NOT_FOUND" });
  if (inv.msisdn !== msisdn) return res.status(409).json({ error: "MSISDN_MISMATCH" });
  if (inv.amount !== Number(amount)) return res.status(409).json({ error: "AMOUNT_MISMATCH" });

  try {
    const result = InvoicesStore.pay(invoiceId);
    return res.status(201).json(result);
  } catch (e: any) {
    if (e.message === "INVOICE_ALREADY_PAID") return res.status(409).json({ error: "INVOICE_ALREADY_PAID" });
    return res.status(500).json({ error: "INTERNAL_ERROR" });
  }
});
