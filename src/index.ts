import "dotenv/config";
import express from "express";

type Currency = "MXN";
type TelcoPackage = { id: string; name: string; priceCents: number; currency: Currency; validityDays: number };
type InvoiceStatus = "PENDING" | "PAID";
type Invoice = {
  id: string;
  msisdn: string;
  packageId: string;
  amountCents: number;
  currency: Currency;
  status: InvoiceStatus;
  paymentId: string | null;
  createdAt: string;
  updatedAt: string;
};
type PaymentMethod = "CARD" | "CASH" | "TRANSFER";
type Payment = { id: string; invoiceId: string; method: PaymentMethod; status: "OK" | "FAIL"; createdAt: string };

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

function nowIso(): string {
  return new Date().toISOString();
}

function nextInvoiceId(): string {
  const n = String(invoiceSeq++).padStart(6, "0");
  return `INV-${n}`;
}

function nextPaymentId(): string {
  const n = String(paymentSeq++).padStart(6, "0");
  return `PAY-${n}`;
}

function isMsisdnValid(msisdn: unknown): msisdn is string {
  return typeof msisdn === "string" && /^[0-9]{10,15}$/.test(msisdn);
}

function asNonEmptyString(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t ? t : null;
}

function isPaymentMethod(v: unknown): v is PaymentMethod {
  return v === "CARD" || v === "CASH" || v === "TRANSFER";
}

const app = express();
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/packages", (_req, res) => {
  res.json({ items: Array.from(packages.values()) });
});

app.post("/invoices", (req, res) => {
  const msisdn = (req.body ?? {}).msisdn;
  const packageId = asNonEmptyString((req.body ?? {}).packageId);

  if (!isMsisdnValid(msisdn)) return res.status(400).json({ error: "INVALID_MSISDN" });
  if (!packageId) return res.status(400).json({ error: "INVALID_PACKAGE_ID" });

  const pkg = packages.get(packageId);
  if (!pkg) return res.status(404).json({ error: "PACKAGE_NOT_FOUND" });

  const createdAt = nowIso();
  const invoice: Invoice = {
    id: nextInvoiceId(),
    msisdn,
    packageId: pkg.id,
    amountCents: pkg.priceCents,
    currency: pkg.currency,
    status: "PENDING",
    paymentId: null,
    createdAt,
    updatedAt: createdAt,
  };

  invoices.set(invoice.id, invoice);
  res.status(201).json(invoice);
});

app.post("/payments", (req, res) => {
  const invoiceId = asNonEmptyString((req.body ?? {}).invoiceId);
  const methodRaw = (req.body ?? {}).method;

  if (!invoiceId) return res.status(400).json({ error: "INVOICE_ID_REQUIRED" });
  const method: PaymentMethod = isPaymentMethod(methodRaw) ? methodRaw : "CARD";

  const inv = invoices.get(invoiceId);
  if (!inv) return res.status(404).json({ error: "INVOICE_NOT_FOUND" });
  if (inv.status === "PAID") return res.status(409).json({ error: "INVOICE_ALREADY_PAID" });

  const payment: Payment = {
    id: nextPaymentId(),
    invoiceId: inv.id,
    method,
    status: method === "TRANSFER" ? "FAIL" : "OK",
    createdAt: nowIso(),
  };

  payments.set(payment.id, payment);

  if (payment.status === "OK") {
    inv.status = "PAID";
    inv.paymentId = payment.id;
    inv.updatedAt = payment.createdAt;
    invoices.set(inv.id, inv);
  }

  res.status(201).json({ payment, invoice: inv });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`deps-minimas on :${PORT}`);
});
