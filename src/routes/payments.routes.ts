import { Router } from "express";
import type { Store } from "../infra/store";
import { Errors } from "../domain/errors";
import { parsePaymentMethod, asNonEmptyString } from "../domain/validation";
import { asyncHandler } from "../http/async-handler";

export function paymentsRouter(store: Store) {
  const r = Router();

  r.post("/payments", asyncHandler(async (req, res) => {
    const idempotencyKey = asNonEmptyString(req.header("Idempotency-Key") ?? undefined);
    const invoiceIdRaw = (req.body ?? {}).invoiceId;
    const invoiceId = asNonEmptyString(invoiceIdRaw);
    if (!invoiceId) throw Errors.missingInvoiceId();

    // Idempotencia: replay
    if (idempotencyKey) {
      const existingPaymentId = store.idempotency.get(idempotencyKey);
      if (existingPaymentId) {
        const existingPayment = store.payments.get(existingPaymentId);
        if (existingPayment) return res.status(200).json(existingPayment);
      }
    }

    const invoice = store.invoices.get(invoiceId);
    if (!invoice) throw Errors.invoiceNotFound();
    if (invoice.status === "PAID") throw Errors.invoiceAlreadyPaid();

    const method = parsePaymentMethod((req.body ?? {}).method);

    const payment = store.createPayment({
      invoiceId: invoice.id,
      amountCents: invoice.amountCents,
      currency: invoice.currency,
      method
    });

    store.payments.set(payment.id, payment);
    if (idempotencyKey) store.idempotency.set(idempotencyKey, payment.id);

    // Transición de estado (clara y única)
    invoice.status = "PAID";
    invoice.paidAt = payment.createdAt;
    invoice.paymentId = payment.id;
    invoice.updatedAt = payment.createdAt;

    res.status(201).json(payment);
  }));

  r.get("/payments/:id", asyncHandler(async (req, res) => {
    const payment = store.payments.get(req.params.id);
    if (!payment) return res.status(404).json({ error: "PAYMENT_NOT_FOUND" });
    res.json(payment);
  }));

  // debug (opcional)
  r.get("/_debug/payments", asyncHandler(async (_req, res) => {
    res.json({ items: Array.from(store.payments.values()) });
  }));

  return r;
}
