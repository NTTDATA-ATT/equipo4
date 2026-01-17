import "dotenv/config";
import express from "express";
import { asyncHandler, errorMiddleware } from "./http";
import { Errors } from "./errors";
import { asNonEmptyString, isMsisdnValid, parsePaymentMethod, type PaymentMethod } from "./validation";

type Currency = "MXN";
type TelcoPackage = { id: string; name: string; priceCents: number; currency: Currency; validityDays: number };
type InvoiceStatus = "PENDING" | "PAID";
type Invoice = { id: string; msisdn: string; packageId: string; amountCents: number; currency: Currency; status: InvoiceStatus; paymentId: string | null };
type Payment = { id: string; invoiceId: string; method: PaymentMethod; status: "OK" | "FAIL" };

const PORT = Number(process.env.PORT ?? 3000);

const packages = new Map<string, TelcoPackage>([
  ["PKG-5GB",  { id: "PKG-5GB",  name: "Paquete 5GB",  priceCents: 9900,  currency: "MXN", validityDays: 30 }],
  ["PKG-10GB", { id: "PKG-10GB", name: "Paquete 10GB", priceCents: 14900, currency: "MXN", validityDays: 30 }],
  ["PKG-UNL",  { id: "PKG-UNL",  name: "Ilimitado",    priceCents: 19900, currency: "MXN", validityDays: 30 }]
]);
const invoices = new Map<string, Invoice>();
const payments = new Map<string, Payment>();

let invoiceSeq = 1;
let paymentSeq = 1;

function nextInvoiceId(): string {
  const n = String(invoiceSeq++).padStart(6, "0");
  return `INV-${n}`;
}
function nextPaymentId(): string {
  const n = String(paymentSeq++).padStart(6, "0");
  return `PAY-${n}`;
}

const app = express();
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));

app.get("/packages", (_req, res) => {
  res.json({ items: Array.from(packages.values()) });
});

app.post("/invoices", asyncHandler(async (req, res) => {
  const msisdn = (req.body ?? {}).msisdn;
  const packageId = asNonEmptyString((req.body ?? {}).packageId);

  if (!isMsisdnValid(msisdn)) throw Errors.invalidMsisdn();
  if (!packageId) throw Errors.invalidPackageId();

  const pkg = packages.get(packageId);
  if (!pkg) throw Errors.packageNotFound();

  const invoice: Invoice = {
    id: nextInvoiceId(),
    msisdn,
    packageId: pkg.id,
    amountCents: pkg.priceCents,
    currency: pkg.currency,
    status: "PENDING",
    paymentId: null
  };

  invoices.set(invoice.id, invoice);
  res.status(201).json(invoice);
}));

app.post("/payments", asyncHandler(async (req, res) => {
  const invoiceId = asNonEmptyString((req.body ?? {}).invoiceId);
  if (!invoiceId) throw Errors.invoiceIdRequired();

  const method = parsePaymentMethod((req.body ?? {}).method);

  const inv = invoices.get(invoiceId);
  if (!inv) throw Errors.invoiceNotFound();
  if (inv.status === "PAID") throw Errors.invoiceAlreadyPaid();

  const ok = method !== "TRANSFER";

  const payment: Payment = {
    id: nextPaymentId(),
    invoiceId: inv.id,
    method,
    status: ok ? "OK" : "FAIL"
  };

  payments.set(payment.id, payment);

  if (payment.status === "OK") {
    inv.status = "PAID";
    inv.paymentId = payment.id;
    invoices.set(inv.id, inv);
  }

  res.status(201).json({ payment, invoice: inv });
}));

app.use(errorMiddleware);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`errores-buenos on :${PORT}`);
});
