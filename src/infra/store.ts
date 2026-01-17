import type { Invoice, Payment, TelcoPackage } from "../domain/types";
import { nowIso } from "../domain/validation";

export function createStore() {
  const packages = new Map<string, TelcoPackage>([
    ["PKG-5GB",  { id: "PKG-5GB",  name: "Paquete 5GB",  priceCents: 9900,  currency: "MXN", validityDays: 30 }],
    ["PKG-10GB", { id: "PKG-10GB", name: "Paquete 10GB", priceCents: 14900, currency: "MXN", validityDays: 30 }],
    ["PKG-UNL",  { id: "PKG-UNL",  name: "Ilimitado",    priceCents: 19900, currency: "MXN", validityDays: 30 }]
  ]);

  const invoices = new Map<string, Invoice>();
  const payments = new Map<string, Payment>();

  // Idempotency-Key -> paymentId
  const idempotency = new Map<string, string>();

  let invoiceSeq = 1;
  let paymentSeq = 1;

  function nextInvoiceId() {
    return `INV-${String(invoiceSeq++).padStart(6, "0")}`;
  }

  function nextPaymentId() {
    return `PAY-${String(paymentSeq++).padStart(6, "0")}`;
  }

  function createInvoice(input: {
    msisdn: string;
    packageId: string;
    amountCents: number;
    currency: "MXN";
  }): Invoice {
    const id = nextInvoiceId();
    const createdAt = nowIso();
    return {
      id,
      msisdn: input.msisdn,
      packageId: input.packageId,
      amountCents: input.amountCents,
      currency: input.currency,
      status: "PENDING",
      createdAt,
      updatedAt: createdAt,
      paidAt: null,
      paymentId: null
    };
  }

  function createPayment(input: {
    invoiceId: string;
    amountCents: number;
    currency: "MXN";
    method: "CARD" | "CASH" | "TRANSFER";
  }): Payment {
    return {
      id: nextPaymentId(),
      invoiceId: input.invoiceId,
      amountCents: input.amountCents,
      currency: input.currency,
      method: input.method,
      status: "SUCCEEDED",
      createdAt: nowIso()
    };
  }

  return {
    packages,
    invoices,
    payments,
    idempotency,
    createInvoice,
    createPayment
  };
}
export type Store = ReturnType<typeof createStore>;
