
import express from "express";
import type { Request, Response } from "express";

const app = express();
app.use(express.json());

//const PORT = Number(process.env.PORT ?? 8080);
const PORT = Number(3000);

// ---------- Types ----------
type Currency = "MXN";

type TelcoPackage = {
  id: string;
  name: string;
  priceCents: number;
  currency: Currency;
  validityDays: number;
};

type InvoiceStatus = "PENDING" | "PAID";

type Invoice = {
  id: string;
  msisdn: string;
  packageId: string;
  amountCents: number;
  currency: Currency;
  status: InvoiceStatus;
  createdAt: string;
  updatedAt: string;
  paidAt: string | null;
  paymentId: string | null;
};

type PaymentStatus = "SUCCEEDED";

type Payment = {
  id: string;
  invoiceId: string;
  amountCents: number;
  currency: Currency;
  method: "CARD" | "CASH" | "TRANSFER";
  status: PaymentStatus;
  createdAt: string;
};

// ---------- In-memory stores (demo) ----------
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

// ---------- Helpers ----------
function nowIso(): string {
  return new Date().toISOString();
}

function isMsisdnValid(msisdn: unknown): msisdn is string {
  return typeof msisdn === "string" && /^[0-9]{10,15}$/.test(msisdn);
}

function nextInvoiceId(): string {
  return `INV-${String(invoiceSeq++).padStart(6, "0")}`;
}

function nextPaymentId(): string {
  return `PAY-${String(paymentSeq++).padStart(6, "0")}`;
}

// ---------- Routes ----------
app.get("/health", (_req: Request, res: Response) => {
  res.json({ ok: true, service: "telco-billing-service-ts" });
});

// Packages
app.get("/packages", (_req: Request, res: Response) => {
  res.json({ items: Array.from(packages.values()) });
});

app.get("/packages/:id", (req: Request, res: Response) => {
  const pkg = packages.get(req.params.id);
  if (!pkg) return res.status(404).json({ error: "PACKAGE_NOT_FOUND" });
  return res.json(pkg);
});

// Invoices
type CreateInvoiceBody = { msisdn?: unknown; packageId?: unknown };

app.post("/invoices", (req: Request<{}, {}, CreateInvoiceBody>, res: Response) => {
  const { msisdn, packageId } = req.body ?? {};

  if (!isMsisdnValid(msisdn)) {
    return res.status(400).json({ error: "INVALID_MSISDN", hint: "Use 10-15 digits" });
  }
  if (typeof packageId !== "string" || !packageId) {
    return res.status(400).json({ error: "INVALID_PACKAGE_ID" });
  }

  const pkg = packages.get(packageId);
  if (!pkg) return res.status(404).json({ error: "PACKAGE_NOT_FOUND" });

  const id = nextInvoiceId();
  const createdAt = nowIso();

  const invoice: Invoice = {
    id,
    msisdn,
    packageId: pkg.id,
    amountCents: pkg.priceCents,
    currency: pkg.currency,
    status: "PENDING",
    createdAt,
    updatedAt: createdAt,
    paidAt: null,
    paymentId: null
  };

  invoices.set(id, invoice);
  return res.status(201).json(invoice);
});

app.get("/invoices/:id", (req: Request, res: Response) => {
  const inv = invoices.get(req.params.id);
  if (!inv) return res.status(404).json({ error: "INVOICE_NOT_FOUND" });
  return res.json(inv);
});

// Payments
type PaymentMethod = Payment["method"];
type CreatePaymentBody = { invoiceId?: unknown; method?: unknown };

function parseMethod(m: unknown): PaymentMethod {
  if (m === "CASH" || m === "TRANSFER" || m === "CARD") return m;
  return "CARD";
}

app.post("/payments", (req: Request<{}, {}, CreatePaymentBody>, res: Response) => {
  const idempotencyKey = req.header("Idempotency-Key") ?? undefined;
  const { invoiceId, method } = req.body ?? {};

  if (idempotencyKey && idempotency.has(idempotencyKey)) {
    const existingPaymentId = idempotency.get(idempotencyKey)!;
    const existingPayment = payments.get(existingPaymentId);
    // should exist, but be safe:
    if (existingPayment) return res.status(200).json(existingPayment);
  }

  if (typeof invoiceId !== "string" || !invoiceId) {
    return res.status(400).json({ error: "invoiceId required" });
  }

  const inv = invoices.get(invoiceId);
  if (!inv) return res.status(404).json({ error: "INVOICE_NOT_FOUND" });

  if (inv.status === "PAID") {
    return res.status(409).json({ error: "INVOICE_ALREADY_PAID", invoice: inv });
  }

  const paymentId = nextPaymentId();
  const createdAt = nowIso();

  const payment: Payment = {
    id: paymentId,
    invoiceId,
    amountCents: inv.amountCents,
    currency: inv.currency,
    method: parseMethod(method),
    status: "SUCCEEDED",
    createdAt
  };

  payments.set(paymentId, payment);
  if (idempotencyKey) idempotency.set(idempotencyKey, paymentId);

  // Update invoice to PAID
  inv.status = "PAID";
  inv.paidAt = createdAt;
  inv.paymentId = paymentId;
  inv.updatedAt = createdAt;

  return res.status(201).json(payment);
});

app.get("/payments/:id", (req: Request, res: Response) => {
  const p = payments.get(req.params.id);
  if (!p) return res.status(404).json({ error: "PAYMENT_NOT_FOUND" });
  return res.json(p);
});

// Debug lists (nice for practice)
app.get("/_debug/invoices", (_req: Request, res: Response) => {
  res.json({ items: Array.from(invoices.values()) });
});

app.get("/_debug/payments", (_req: Request, res: Response) => {
  res.json({ items: Array.from(payments.values()) });
});

app.listen(PORT, () => {
  console.log(`telco-billing-service-ts on :${PORT}`);
});
