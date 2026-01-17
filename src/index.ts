import "dotenv/config";
import express from "express";
import padStart from "lodash/padStart.js";
import dayjs from "dayjs";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import { z } from "zod";

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

function nowIso(): string {
  return dayjs().toISOString();
}

function nextInvoiceId(): string {
  const n = padStart(String(invoiceSeq++), 6, "0");
  return `INV-${n}`;
}

const createInvoiceSchema = z.object({
  msisdn: z.string().regex(/^[0-9]{10,15}$/),
  packageId: z.string().min(1),
});

const createPaymentSchema = z.object({
  invoiceId: z.string().min(1),
  method: z.enum(["CARD", "CASH", "TRANSFER"]).default("CARD"),
});

const app = express();
app.use(express.json());

app.get("/health", async (_req, res) => {
  const self = await axios.get(`http://127.0.0.1:${PORT}/_ping`).then(r => r.data).catch(() => ({ ok: false }));
  res.json({ ok: true, self });
});

app.get("/_ping", (_req, res) => res.json({ ok: true }));

app.get("/packages", (_req, res) => {
  res.json({ items: Array.from(packages.values()) });
});

app.post("/invoices", (req, res) => {
  const parsed = createInvoiceSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "INVALID_INPUT", details: parsed.error.flatten() });

  const { msisdn, packageId } = parsed.data;

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
  const parsed = createPaymentSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "INVALID_INPUT", details: parsed.error.flatten() });

  const { invoiceId, method } = parsed.data;

  const inv = invoices.get(invoiceId);
  if (!inv) return res.status(404).json({ error: "INVOICE_NOT_FOUND" });
  if (inv.status === "PAID") return res.status(409).json({ error: "INVOICE_ALREADY_PAID" });

  const payment: Payment = {
    id: uuidv4(),
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
  console.log(`deps-innecesarias on :${PORT}`);
});
